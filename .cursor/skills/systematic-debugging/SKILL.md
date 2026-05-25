---
name: systematic-debugging
description: >-
  Use when encountering any bug, test failure, flaky test, or unexpected behavior
  in this QA framework — before proposing or applying fixes. Applies to Playwright
  API/UI tests, fixtures, auth, mocks, and TypeScript API layer.
---

# Systematic Debugging (qa-framework)

## Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Do not edit code until Phase 1 is complete. Do not commit without explicit user approval.

## When to Use

- Playwright test failures (`tests/api/`, `tests/ui/`, `tests/mocks/`)
- `ApiError` with unexpected status/body
- Auth/setup failures (`tests/auth/*.setup.ts`, `PROD_AUTH`, missing `.env`)
- Flaky or order-dependent tests (`fullyParallel: true`)
- CI-only failures (`.github/workflows/playwright.yml`)
- TypeScript or ESLint errors after changes

**Especially when:** the fix "seems obvious", time pressure is high, or 2+ prior fix attempts failed.

---

## Project Context

Before debugging, know where things live:

| Layer | Location |
|---|---|
| API services | `api/services/*.api.ts`, `api/core/baseApi.ts` |
| Errors | `api/errors/api.error.ts` |
| Auth | `utils/auth/`, `api/client/authenticatedApiClient.ts` |
| Fixtures | `tests/fixtures/api.fixture.ts`, `auth.fixture.ts` |
| Factories | `factories/user.factory.ts` |
| Mocks | `mocks/users.mock.ts` |
| Config | `playwright.config.ts`, `.env` |

Key env vars: `API_BASE_URL`, `PROD_AUTH`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BASE_URL`.

---

## Phase 1: Root Cause Investigation

**Before any fix:**

### 1. Read the failure completely

- Playwright HTML report: `npx playwright show-report`
- Trace (on retry): `trace: 'on-first-retry'` in `playwright.config.ts`
- Full error: status, `ApiError.body`, stack trace, line numbers
- Do not skim — the message often states the exact cause

### 2. Reproduce reliably

```bash
# Single test, one worker (eliminate parallelism noise)
npx playwright test tests/api/users.spec.ts -g "admin creates user" --workers=1

# API project only
npx playwright test --project=api

# UI with auth dependency
npx playwright test --project=ui-chromium --workers=1
```

Note: exact command, env, pass/fail rate. If flaky → do not guess; gather more runs.

### 3. Check recent changes

```bash
git diff
git log -5 --oneline
```

Look for: fixture changes, auth mode, env vars, parallel config, factory data, mock vs real API.

### 4. Trace across layers (this project)

For API failures, verify each boundary:

```
.env vars → AuthenticatedApiClient → APIRequestContext → BaseApi → UsersApi/AuthApi → test assertion
```

Checklist:

- [ ] `.env` exists and `API_BASE_URL` is set (CI: GitHub secrets)
- [ ] `PROD_AUTH=true` → real `/login`; `false` → fake JWT token
- [ ] Credentials match role (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- [ ] Request URL/path matches service method (e.g. `POST /users`)
- [ ] Response shape matches model (`api/models/*.model.ts`)
- [ ] Fixture lifecycle: `existingUser` creates and deletes user in teardown

For UI failures, also check:

- [ ] `setup-auth-admin` project ran and `.playwright/auth/admin.json` exists
- [ ] `storageState` and `baseURL` in `playwright.config.ts`
- [ ] UI project `dependencies: ['setup-auth-admin']`

For mock tests (`tests/mocks/`):

- [ ] Failure is in mock logic, not live API — do not debug network

### 5. Trace data flow backward

When assertion fails deep in the stack:

1. What value is wrong at the assertion?
2. Which service/fixture produced it?
3. Which env/config/auth step set it?
4. Fix at the **source**, not at the assertion line

---

## Phase 2: Pattern Analysis

1. **Find a working reference** in the same codebase:
   - Passing test in `tests/api/users.spec.ts`
   - Working fixture usage in `api.fixture.ts`
   - Similar service method in `UsersApi` vs `AuthApi`

2. **Read the reference completely** — do not skim `BaseApi` or auth client.

3. **List every difference** between working and broken paths (env, auth mode, fixture, data from factory, parallel worker).

4. **Check dependencies**: factories (not hardcoded data in tests), custom fixtures (not raw `@playwright/test` import).

---

## Phase 3: Hypothesis and Testing

1. State one hypothesis: *"Root cause is X because Y (evidence: …)"*
2. Test with the **smallest** change or diagnostic (log, single test run, temporary `--debug`).
3. One variable at a time — no bundled edits.
4. Hypothesis wrong → new hypothesis; do not stack fixes.

Diagnostic examples (remove after investigation):

```typescript
// Temporary: log response in a failing test
const response = await adminApiContext.get('/users');
console.log(response.status(), await response.text());
```

Prefer `test.step` for permanent flow; use `console.log` only during investigation.

---

## Phase 4: Implementation

### 1. Failing test first

- Reproduce in the smallest `.spec.ts` case or extend an existing test
- For API: use `UserFactory.create()` via factories — never inline Faker in specs
- Use fixtures from `tests/fixtures/`, not raw Playwright imports

### 2. Single fix at root cause

- One logical change
- No drive-by refactors, no unrelated cleanup
- Match existing patterns (`BaseApi`, `ApiError`, POM for UI)

### 3. Verify

```bash
npx playwright test <affected-spec> --workers=1
npm run lint
```

- Targeted test passes
- Related specs still pass
- No new lint/type errors

### 4. If fix fails

| Attempts | Action |
|---|---|
| 1–2 | Return to Phase 1 with new evidence |
| ≥ 3 | Stop — likely architectural issue (fixture design, auth strategy, parallel isolation). Discuss with user before more changes |

### 5. User approval

Per project rules: **propose the fix and wait for approval** before applying, unless the user explicitly asked to implement.

---

## Red Flags — STOP

- "Quick fix, investigate later"
- Changing code before reproducing
- Editing multiple files "to see if it helps"
- Skipping `.env`/auth check on API failures
- Fixing assertion instead of data source
- Adding `test.skip` without root cause
- Third failed fix attempt without stepping back

---

## Quick Commands

```bash
# Report after failure
npx playwright show-report

# List tests
npx playwright test --list

# Debug mode (UI)
npx playwright test tests/ui/example.spec.ts --debug

# API only, no UI auth setup
npx playwright test --project=api

# Lint
npm run lint
```

---

## When No Single Root Cause Exists

If investigation shows external/timing/env flakiness:

1. Document what was checked
2. Propose handling: retry policy, explicit wait, better fixture isolation, CI env docs
3. Add logging or `test.step` for future runs

Incomplete investigation is the usual reason for "no root cause."
