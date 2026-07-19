# QA Framework — Playwright + TypeScript

Lightweight SDET automation framework for UI and API testing built on top of `@playwright/test`.

**Demo target app:** [TodoMVC](https://demo.playwright.dev/todomvc) (Playwright official demo)  
**API target:** configurable via `API_BASE_URL` env variable

---

## What Is Included

- **UI tests** with Page Object Model, typed page actions, and faker-generated test data
- **API tests** built on a typed service layer (`BaseApi`, `UsersApi`, `AuthApi`)
- **Reusable auth state** generated once for Todo UI browser projects
- **Contract stub-servers** — in-process HTTP servers (`MockApiServer`) that the real `UsersApi` runs against; specs in `tests/contract/`

See **`docs/testing-layers.md`** for the full layer map (stub-servers vs contract vs live API).
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
  todo.factory.ts                   ← Todo title generation
  user.factory.ts                   ← faker-based test data builders
mocks/
  mockServer.ts                     ← in-process stub-server (Users API)
  conduitMockServer.ts              ← Conduit stub-server (IDOR enforcement)
  README.md                         ← pointer: implementations, not specs
tests/
  api/users.spec.ts                 ← live API test suite
  contract/
    users.contract.spec.ts          ← contract tests: UsersApi against MockApiServer
    conduit/articles-idor.contract.spec.ts
    README.md
  auth/admin.setup.ts               ← storageState generation for admin role
  fixtures/
    api.fixture.ts                  ← usersApi, authApi, adminApiContext, existingUser
    todo-ui.fixture.ts              ← todoPage (pre-navigated TodoMVC)
    conduit-ui.fixture.ts           ← Conduit Page Objects
    conduit-api.fixture.ts          ← Conduit API clients + cleanup
    contract.fixture.ts             ← mockServer, mockUsersApi, conduitMockServer
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

Page objects encapsulate all locators and actions. Tests never reference `locator` / `getByRole` directly. `todo-ui.fixture.ts` injects a pre-navigated `TodoPage` instance.

### Auth Architecture

Todo and Conduit use independent session mechanisms:

| Layer | What it does |
|---|---|
| `setup-auth-admin` project | generates `.playwright/auth/admin.json` before Todo UI specs run |
| `utils/auth/conduit.session.ts` | injects/removes `localStorage.jwtToken` for Conduit UI scenarios |

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

Copy `.env.example` to `.env` for local configuration. Keep real credentials
and `QASE_TESTOPS_API_TOKEN` only in `.env` or CI secrets; `.env` is gitignored.

### Global Setup / Teardown

| Hook | File | Responsibility |
|---|---|---|
| `globalSetup` | `config/global-setup.ts` | Validate config (fail fast on inconsistent `PROD_AUTH` setup) and print a run banner |
| `globalTeardown` | `config/global-teardown.ts` | Remove generated `.playwright/auth` state so stale tokens don't leak across runs |

---

## Test Tags

Every test carries `@smoke` or `@regression` plus `@api` or `@ui`.

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path, fast feedback |
| `@regression` | Full coverage |
| `@api` | API layer tests |
| `@ui` | Browser tests |
| `@visual` | Screenshot baseline tests |
| `@a11y` | Accessibility (axe-core) tests |

Run by tag locally:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@api"
npx playwright test --project=ui-chromium --grep "@smoke"
```

### npm scripts (shortcuts)

| Script | What runs |
|---|---|
| `npm run test:smoke` | contract + a11y + ui-chromium `@smoke` (PR-like, no ReqRes API) |
| `npm run test:smoke:all` | above + `api` `@smoke` (needs `API_BASE_URL` + credentials) |
| `npm run test:smoke:ui` | Todo UI smoke only |
| `npm run test:smoke:api` | Users API smoke only |
| `npm run test:smoke:contract` | contract smoke only |
| `npm run test:contract` / `test:ui` / `test:api` / `test:a11y` / `test:visual` | full project, no tag filter |
| `npm run test:mock` | deprecated alias → `test:contract` |
| `npm run test:conduit:demo` | Conduit API + UI against public demo |
| `npm run test:conduit:demo:smoke` | Conduit smoke against public demo |
| `npm run test:conduit:smoke` | Docker stack + Conduit API/UI smoke |
| `npm run test:conduit` | Docker stack + full Conduit API/UI + IDOR contract |

---

## RealWorld (Conduit) Live API

The `conduit-api` project exercises the framework end-to-end against a real,
stateful REST backend — the [RealWorld](https://realworld-docs.netlify.app/)
"Conduit" API. It demonstrates the full stack on non-trivial logic: JWT-style
auth, CRUD with server-derived state, and contract validation.

**Default target:** public demo (`https://api.realworld.show/api`) when env vars
are unset.

**Recommended for local + CI:** an isolated Docker stack (Nitro + Prisma API and
Angular UI) — see [Conduit Docker stack](#conduit-docker-stack) below. Avoids
shared-demo flakiness under parallel runs.

Layout (`api/conduit/`): zod `models/`, a token-auth `client/`, and
`services/` (`ConduitAuthApi`, `ArticlesApi`). Tests live in
`tests/api/conduit/` and use `tests/fixtures/conduit-api.fixture.ts`.

Key design points:

- **Auth header is `Token <jwt>`** (not `Bearer`) — a dedicated client, the
  existing reqres-based auth is untouched.
- **Fresh throwaway user per test** (`ConduitUserFactory`) + sequential teardown
  that deletes articles the user authored.
- **Unique titles** — slugs are derived from the title and must be globally
  unique, so the factory seeds each title with a random token.
- **IDOR (QA-44)** — update/delete by non-owner is verified against
  `ConduitMockServer` in `tests/contract/conduit/` (public demo does not enforce
  403 consistently).
- **Serial + retries** — `fullyParallel: false` and `retries: 2` on Conduit
  projects.

```bash
npx playwright test --project=conduit-api
# Public demo explicitly:
CONDUIT_API_URL=https://api.realworld.show/api npx playwright test --project=conduit-api
```

In CI the `conduit-ci` job runs on **push, pull request, nightly schedule, and
manual dispatch** — it starts the Docker stack, then runs `conduit-api` and
`conduit-ui` against `127.0.0.1` (no dependency on the public demo).

### Conduit Docker stack

Requires [Docker](https://docs.docker.com/get-docker/) with Compose v2.

| Service | URL | Image source |
|---|---|---|
| API | `http://127.0.0.1:3000/api` | [nitro-prisma-zod-realworld-example-app](https://github.com/realworld-apps/nitro-prisma-zod-realworld-example-app) |
| UI | `http://127.0.0.1:4201` | [angular-realworld-example-app](https://github.com/realworld-apps/angular-realworld-example-app) (API URL patched at build) |

```bash
# Start API + UI, wait for healthchecks
npm run conduit:up

# Conduit smoke or full suite against Docker
npm run test:conduit:smoke
npm run test:conduit

# Conduit against public demo (no Docker)
npm run test:conduit:demo:smoke
npm run test:conduit:demo

# Stop and remove volumes
npm run conduit:down
```

Or set env manually after `npm run conduit:up`:

```bash
export CONDUIT_API_URL=http://127.0.0.1:3000/api
export CONDUIT_UI_URL=http://127.0.0.1:4201
npx playwright test --project=conduit-api --project=conduit-ui
```

Files: `docker-compose.conduit.yml`, `docker/conduit/Dockerfile.api`,
`docker/conduit/Dockerfile.ui`.

### UI layer (Phase 2)

The `conduit-ui` project drives the RealWorld Angular SPA (Docker UI by default
in `conduit-ci`, or `demo.realworld.show` when env is unset).
Page Objects live under `tests/pages/conduit/`; specs under `tests/ui/conduit/`.

| Page Object | Route | Responsibility |
|---|---|---|
| `ConduitHomePage` | `/` | Feed and authentication-state navigation locators |
| `ConduitLoginPage` | `/login` | Email + password sign-in |
| `ConduitRegisterPage` | `/register` | New account form |
| `ConduitEditorPage` | `/editor` | Compose and publish an article |
| `ConduitArticlePage` | `/article/{slug}` | Read title, body, tags |

**Cross-layer UI checks:** UI specs import `@fixtures/conduit-ui.fixture` only.
When a test needs API seed data (e.g. create an article before opening it in the
browser), call the Conduit API inline in a `test.step` — same pattern as
`auth.spec.ts`. `utils/auth/conduit.session.ts` provides
`authenticateConduitUser(page, user)` to inject the JWT into `localStorage.jwtToken`
before navigation.

```bash
npx playwright test --project=conduit-ui
```

---

## Accessibility

The `ui-a11y` project runs [`axe-core`](https://github.com/dequelabs/axe-core)
scans (WCAG 2.0/2.1 level A & AA) against the app via the `makeAxeBuilder`
fixture. Results are platform-independent, so this project runs in regular CI.

```bash
npx playwright test --project=ui-a11y
```

On failure the full violation report is attached to the Playwright HTML report
for triage. Known issues in the third-party TodoMVC demo (e.g. `color-contrast`)
are explicitly disabled with a documented justification, so the scan still
guards against any *other* accessibility regression.

---

## Visual Regression

The `ui-visual` project captures screenshot baselines of the TodoMVC app
(targeting the `.todoapp` container with animations frozen and a small
pixel-diff tolerance).

**Baselines are platform-specific** — the filename encodes the OS (e.g.
`...-darwin.png`, `...-linux.png`), since font/AA rendering differs per
platform. Both local (darwin) and CI (linux) baselines live side by side.

### Generating Linux baselines for CI

Local `--update-snapshots` only produces a baseline for *your* OS. To get the
Linux baselines that CI compares against, run the **Update Visual Baselines**
workflow (`.github/workflows/visual-baselines.yml`) from the Actions tab. It
generates baselines on an ubuntu runner — the same environment as CI — and
commits them back to the branch.

### How CI uses them

The `visual-ci` job runs `ui-visual` automatically **once Linux baselines
exist** in the repo. Until then it skips gracefully, so the build never goes
red just because baselines haven't been bootstrapped yet. After an intended UI
change, re-run the **Update Visual Baselines** workflow to refresh them.

---

## Local Usage

```bash
# Install dependencies (also sets up Husky hooks)
npm ci

# Run all tests
npm test

# Run UI tests (chromium by default)
npx playwright test --project=ui-chromium

# Run UI tests in other browsers
npx playwright test --project=ui-firefox
npx playwright test --project=ui-webkit

# Run API tests only (needs a real backend)
npx playwright test --project=api

# Run contract tests against the in-process mock server (no backend needed)
npx playwright test --project=contract

# Run RealWorld (Conduit) live-API tests against a public backend
npx playwright test --project=conduit-api

# Run RealWorld (Conduit) UI tests against the live SPA
npx playwright test --project=conduit-ui

# Run visual regression tests against committed baselines
npx playwright test --project=ui-visual

# Regenerate visual baselines after an intended UI change
npx playwright test --project=ui-visual --update-snapshots

# Lint
npm run lint

# Format
npm run format

# Type check
npx tsc --noEmit

# Generate and open the Allure report (requires Java 8+ on PATH)
npm run allure:report
```

---

## Allure Reporting

[Allure](https://allurereport.org/) gives a richer report than the built-in
HTML one: grouped steps, attachments, severity labels, and — most usefully —
**retry history per test** so flaky tests are easy to spot.

The `allure-playwright` reporter writes raw results to `allure-results/` on
every run. Turn them into a browsable report:

```bash
npm run allure:generate   # build allure-report/ from allure-results/
npm run allure:open       # open the generated report
npm run allure:report     # generate + open in one step
```

> Allure's CLI is a Java app, so local report generation needs Java 8+ on your
> PATH. Test execution itself does **not** need Java — only `generate`/`open`.

### Trends in CI (GitHub Pages)

In CI the `ui-ci` job builds the report from the combined results (mock + UI +
a11y) with the npm-installed `allure-commandline` (Java 17 via
`actions/setup-java`) and **merges the previous run's `history/`** from the
`gh-pages` branch so trend charts accumulate over time. The report is uploaded
as the `allure-report-ui` artifact and, **on push to `main`**, published to the
`gh-pages` branch via `peaceiris/actions-gh-pages`.

This gives a live dashboard at `https://<owner>.github.io/<repo>/` with
trend graphs (pass rate, retries/flakiness, duration) across the last 30 runs.

> One-time setup: enable GitHub Pages for the repo with source = `gh-pages`
> branch (Settings → Pages). PR runs intentionally don't publish — only merges
> to `main` update the trend history.

---

## CI (GitHub Actions)

Workflow: `.github/workflows/playwright.yml`

### Jobs

**`ui-ci`** — always runs on push / PR to `main`:
1. Run lint (`npm run lint`)
2. Run `mock` contract tests (no backend/secrets required)
3. Install Playwright browsers
4. Run `ui-chromium` project (cross-browser `ui-firefox` / `ui-webkit` available via manual dispatch)
5. Run `ui-a11y` accessibility checks
6. Generate the Allure report and upload `allure-report-ui`, `playwright-report-ui`, `junit-report-ui` artifacts

> On push/PR only `ui-chromium` runs to keep feedback fast. Trigger `workflow_dispatch` and pick the `project` input to run `ui-firefox` or `ui-webkit`.

### Tag strategy per trigger

The suite is scoped automatically by event so feedback stays fast where it matters:

| Trigger | Tag filter | Intent |
|---|---|---|
| `pull_request` | `@smoke` | Fast critical-path feedback on every PR |
| `push` to `main` | none (full) | Full regression after merge |
| `schedule` (nightly 03:00 UTC) | none (full) | Catch drift / flakiness daily |
| `workflow_dispatch` | manual `grep` input | On-demand selective runs |

**`api-ci`** — runs the real `api` project conditionally:
- If `API_BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` secrets are set → runs API tests
- If secrets are missing → skips gracefully with an informative message

**`conduit-ci`** — starts `docker-compose.conduit.yml`, then runs `conduit-api`,
`conduit-ui`, and Conduit IDOR contract tests against `127.0.0.1`. Runs on
push, pull request, nightly schedule, and manual dispatch.

### Reporters

| Environment | Reporters |
|---|---|
| Local | `list`, `html`, `allure-playwright` |
| CI | `list`, `html`, `junit` (`test-results/junit.xml`), `allure-playwright` |

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
