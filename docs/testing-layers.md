# Testing layers

Quick map for maintainers: where specs live, what backend they use, and which
Playwright project runs them.

> **Navigation:** see [`docs/INDEX.md`](./INDEX.md) for the full documentation index.

> **Stub-server** emulates a backend in-process. **Contract test** verifies
> that our API client (`UsersApi`, `BaseApi`, `ApiError`) behaves correctly
> against that contract — no live network, no `.env` API URL. **Live API test**
> hits a real backend.

---

## Layer matrix

| Layer | Spec folder | Backend | Playwright project |
|---|---|---|---|
| Live API (Users) | `tests/api/*.spec.ts` | `API_BASE_URL` + credentials | `api` |
| Live API (Conduit) | `tests/api/conduit/` | `CONDUIT_API_URL` / Docker | `conduit-api` |
| Contract | `tests/contract/` | `stub-servers/` (in-process) | `contract` |
| UI (Todo) | `tests/ui/` (not `conduit/`) | `demo.playwright.dev` | `ui-chromium`, `ui-firefox`, `ui-webkit` |
| UI (Conduit) | `tests/ui/conduit/` | `CONDUIT_UI_URL` / Docker | `conduit-ui` |
| Visual | `tests/visual/` | TodoMVC hosted demo | `ui-visual` |
| Accessibility | `tests/a11y/` | TodoMVC hosted demo | `ui-a11y` |

---

## Folder roles

| Path | Role |
|---|---|
| `stub-servers/` | **Implementation** — in-process HTTP (`UsersApiStubServer`, `ConduitApiStubServer`) |
| `tests/contract/` | **Specs** — contract tests against stub-servers |
| `mocks/` | **Deprecated redirect** — use `stub-servers/` instead (see [ADR 001](./adr/001-stub-servers-vs-contract-tests.md)) |

See also: [ADR 001 — stub-servers vs contract tests](./adr/001-stub-servers-vs-contract-tests.md).

---

## When to add what

| Change | Stub handler | Contract spec | Live spec |
|---|---|---|---|
| New Users API endpoint | `stub-servers/users-api.stub-server.ts` | `tests/contract/*.contract.spec.ts` | `tests/api/` |
| Conduit behavior public demo cannot test (e.g. IDOR 403) | `stub-servers/conduit-api.stub-server.ts` | `tests/contract/conduit/` | — |
| Conduit CRUD against real backend | — | — | `tests/api/conduit/` |
| UI flow | — | — | `tests/ui/` + `tests/pages/` |

Contract specs **must not** import `@fixtures/api.fixture` or depend on
`API_BASE_URL`.

Import stub-servers via `@stub-servers/*` (not `@mocks/*`).

---

## Glossary

| Term | Meaning in this repo |
|---|---|
| **Stub-server** | Minimal HTTP server in Node (`http.createServer` on random port) |
| **Contract test** | Real service class against stub-server; Playwright project `contract` |
| **Live API test** | Same client against external backend; projects `api` / `conduit-api` |
| **Mock** | Avoid as folder or project name — ambiguous (stub vs spec vs jest mock) |

---

## Run commands

```bash
npm run test:contract              # all contract tests
npm run test:smoke:contract        # contract @smoke only
npx playwright test --project=contract
npx playwright test tests/contract/users.contract.spec.ts --workers=1
```

---

## Local onboarding

After clone, verify without `.env`, backend, or Docker:

```bash
npm ci
npm run test:setup      # playwright install chromium — for UI/a11y only
npm run test:contract   # no browsers, no network
npm run test:smoke      # PR-like: contract + a11y + UI @smoke
```

Full first-run guide, prerequisites, and troubleshooting: [README — First run](../README.md#first-run-2-minutes).
