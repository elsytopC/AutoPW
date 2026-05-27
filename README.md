# QA Framework — Playwright + TypeScript

Lightweight SDET automation framework for UI and API testing built on top of `@playwright/test`.

**Demo target app:** [TodoMVC](https://demo.playwright.dev/todomvc) (Playwright official demo)  
**API target:** configurable via `API_BASE_URL` env variable

---

## What Is Included

- **UI tests** with Page Object Model, typed page actions, and faker-generated test data
- **API tests** built on a typed service layer (`BaseApi`, `UsersApi`, `AuthApi`)
- **Auth fixtures** with role-based browser context (`adminAuth`, `userAuth`)
- **Mock layer** for isolated tests without real network (`UsersMock`)
- **Tag-based test selection** (`@smoke`, `@regression`, `@api`, `@ui`)
- **CI** with separate `ui-ci` / `api-ci` jobs and JUnit reporting
- **Code quality** — ESLint flat config, Prettier, Husky pre-commit + pre-push hooks

---

## Project Structure

```text
api/
  client/authenticatedApiClient.ts  ← creates APIRequestContext per role
  core/baseApi.ts                   ← generic HTTP methods + error handling
  errors/api.error.ts               ← typed ApiError
  models/                           ← auth.model.ts, user.model.ts
  services/                         ← auth.api.ts, users.api.ts
config/
  env.ts                            ← single source of all env variables
factories/
  user.factory.ts                   ← faker-based test data builders
mocks/
  users.mock.ts                     ← static mock responses (no network)
tests/
  api/users.spec.ts                 ← API test suite
  auth/admin.setup.ts               ← storageState generation for admin role
  auth/user.setup.ts                ← storageState generation for user role
  fixtures/
    api.fixture.ts                  ← usersApi, authApi, adminApiContext, existingUser
    ui.fixture.ts                   ← todoPage (pre-navigated)
    auth.fixture.ts                 ← adminAuth, userAuth (role-based page context)
  mocks/users.mock.spec.ts          ← isolated mock-layer tests
  pages/
    base.page.ts                    ← abstract BasePage with shared helpers
    todo.page.ts                    ← TodoPage : BasePage
  ui/todo.spec.ts                   ← UI test suite (TodoMVC)
utils/auth/
  authManager.ts                    ← storageState creation / token refresh
  auth.config.ts                    ← credentials per role from env
  auth.types.ts                     ← UserRole type
  tokenUtils.ts                     ← JWT expiry check
playwright.config.ts
tsconfig.json                       ← path aliases (@api, @config, @fixtures, …)
.github/workflows/playwright.yml
```

---

## Architecture

### API Layer

```
BaseApi
  └── UsersApi   (createUser, getUser, getUsers, deleteUser)
  └── AuthApi    (login)
```

`BaseApi` centralizes HTTP operations and maps non-2xx responses to `ApiError`.  
`AuthenticatedApiClient` creates a pre-authenticated `APIRequestContext` per role.  
All API fixtures are wired in `tests/fixtures/api.fixture.ts`.

### UI Layer

```
BasePage
  └── TodoPage   (addTodo, completeTodo, filterBy, clearCompleted, …)
```

Page objects encapsulate all locators and actions. Tests never reference `locator` / `getByRole` directly. `ui.fixture.ts` injects a pre-navigated `TodoPage` instance.

### Auth Architecture

Two independent auth layers:

| Layer | What it does |
|---|---|
| `setup-auth-admin` project | generates `.playwright/auth/admin.json` before UI specs run |
| `auth.fixture.ts` | overrides browser context per-test for explicit role switching |

Auth mode is controlled by `PROD_AUTH`:
- `PROD_AUTH=true` — performs real login via `API_BASE_URL/login`
- `PROD_AUTH=false` (default) — generates a fake JWT for local/CI use

### Environment Config

All env variables flow through `config/env.ts`:

```typescript
env.prodAuth          // PROD_AUTH === 'true'
env.apiBaseUrl        // API_BASE_URL
env.uiBaseUrl         // BASE_URL ?? UI_BASE_URL ?? 'https://demo.playwright.dev'
env.credentials.admin // ADMIN_EMAIL, ADMIN_PASSWORD
env.credentials.user  // USER_EMAIL, USER_PASSWORD
```

---

## Test Tags

Every test carries `@smoke` or `@regression` plus `@api` or `@ui`.

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path, fast feedback |
| `@regression` | Full coverage |
| `@api` | API layer tests |
| `@ui` | Browser tests |

Run by tag locally:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@api"
npx playwright test --project=ui-chromium --grep "@smoke"
```

---

## Local Usage

```bash
# Install dependencies (also sets up Husky hooks)
npm ci

# Run all tests
npm test

# Run UI tests only
npx playwright test --project=ui-chromium

# Run API tests only
npx playwright test --project=api

# Lint
npm run lint

# Format
npm run format

# Type check
npx tsc --noEmit
```

---

## CI (GitHub Actions)

Workflow: `.github/workflows/playwright.yml`

### Jobs

**`ui-ci`** — always runs on push / PR to `main`:
1. Run lint (`npm run lint`)
2. Install Playwright browsers
3. Run `ui-chromium` project
4. Upload `playwright-report-ui` and `junit-report-ui` artifacts

**`api-ci`** — runs conditionally:
- If `API_BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` secrets are set → runs API tests
- If secrets are missing → skips gracefully with an informative message

### Reporters

| Environment | Reporters |
|---|---|
| Local | `list`, `html` |
| CI | `list`, `html`, `junit` (`test-results/junit.xml`) |

Screenshots are captured on failure. Traces are captured on first retry.

### Manual / Selective Run

Trigger `workflow_dispatch` from the Actions tab and supply a `grep` input:

```
@smoke           → smoke tests only
@regression      → full regression
@api             → API tests only
@ui              → UI tests only
(empty)          → all tests
```

---

## Code Quality Gates

| Gate | When | What |
|---|---|---|
| `pre-commit` (Husky) | every `git commit` | `lint-staged`: ESLint --fix + Prettier on staged `.ts/.js` files |
| `pre-push` (Husky) | every `git push` | `tsc --noEmit` — full type check |
| CI lint step | every push to `main` | `npm run lint` |
