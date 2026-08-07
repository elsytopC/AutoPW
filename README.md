# QA Framework — Playwright + TypeScript

Lightweight SDET automation framework for UI and API testing built on top of `@playwright/test`.

**Demo target app:** [TodoMVC](https://demo.playwright.dev/todomvc) (Playwright official demo)  
**API target:** configurable via `API_BASE_URL` env variable

**New here?** Start at [`docs/INDEX.md`](docs/INDEX.md), then [First run (2 minutes)](#first-run-2-minutes) — `npm ci` → `test:setup` → `test:contract` → `test:smoke` (no `.env`, no backend).

---

## What Is Included

- **UI tests** with Page Object Model, typed page actions, and faker-generated test data
- **API tests** built on a typed service layer (`BaseApi`, `UsersApi`, `AuthenticatedApiClient`)
- **Reusable auth state** generated once for Todo UI browser projects
- **Contract stub-servers** — in-process HTTP servers (`UsersApiStubServer`) that the real `UsersApi` runs against; specs in `tests/contract/`

See **`docs/testing-layers.md`** for the full layer map (stub-servers vs contract vs live API).  
See **`docs/architecture.md`** for diagrams and domain overview.  
See **`docs/cookbooks/`** for step-by-step recipes.
- **Tag-based test selection** (`@smoke`, `@regression`, `@api`, `@ui`, `@conduit`, `@security`)
- **CI** with separate `ui-ci` / `api-ci` jobs and JUnit reporting
- **Code quality** — ESLint flat config, Prettier, Husky pre-commit + pre-push hooks

---

## Domains

The framework targets **two independent apps** on shared infrastructure
(fixtures pattern, factories, POM, CI). Pick the domain that matches your task.

| | Domain A — TodoMVC + Users API | Domain B — Conduit (RealWorld) |
|---|---|---|
| **Purpose** | Simple UI demo + configurable REST API | Full-stack app with JWT, slugs, cross-layer flows |
| **UI target** | `demo.playwright.dev/todomvc` | Conduit Angular SPA (demo or Docker) |
| **API target** | `API_BASE_URL` (ReqRes-style) | `CONDUIT_API_URL` |
| **Auth** | `Bearer` token | `Token <jwt>` |
| **Map** | sections below | [`docs/conduit-map.md`](docs/conduit-map.md) |

---

## Project Structure

### Domain A — TodoMVC + Users API

```text
api/
  client/authenticatedApiClient.ts  ← Bearer token per role
  core/baseApi.ts                   ← generic HTTP methods + error handling
  errors/api.error.ts               ← typed ApiError
  models/user.model.ts              ← Zod schemas for Users API
  services/users.api.ts             ← UsersApi (CRUD)
factories/
  todo.factory.ts
  user.factory.ts
stub-servers/
  users-api.stub-server.ts          ← Users API contract stub
tests/
  api/users.spec.ts                 ← live API
  contract/users.contract.spec.ts   ← contract (stub-server)
  fixtures/api.fixture.ts
  fixtures/todo-ui.fixture.ts
  fixtures/contract.fixture.ts
  pages/todo.page.ts
  ui/todo.spec.ts
  a11y/                             ← axe-core on TodoMVC
  visual/                           ← screenshot baselines
utils/auth/                         ← storageState + /login for Domain A
```

### Domain B — Conduit (RealWorld)

```text
api/conduit/
  client/conduitClient.ts           ← Token auth (not Bearer)
  models/                           ← article, user, comment (Zod)
  services/                         ← ConduitAuthApi, ArticlesApi, CommentsApi
factories/conduit.factory.ts
stub-servers/conduit-api.stub-server.ts  ← IDOR enforcement
tests/
  api/conduit/                      ← live API (project: conduit-api)
  ui/conduit/                       ← browser (project: conduit-ui)
  contract/conduit/                 ← IDOR contract
  fixtures/conduit-api.fixture.ts
  fixtures/conduit-ui.fixture.ts
  pages/conduit/                    ← 5 Page Objects
utils/auth/conduit.session.ts       ← localStorage JWT injection
docker-compose.conduit.yml          ← local API + UI stack
```

Full Conduit file map: [`docs/conduit-map.md`](docs/conduit-map.md).

### Shared infrastructure

```text
config/env.ts                       ← all env variables
config/global-setup.ts              ← fail-fast validation
config/global-teardown.ts           ← cleans .playwright/auth/
tests/auth/admin.setup.ts           ← storageState for Todo UI projects
tests/fixtures/                     ← one fixture file per test layer
playwright.config.ts                ← Playwright projects
tsconfig.json                       ← path aliases (@api, @fixtures, …)
.github/workflows/playwright.yml    ← CI jobs
docs/INDEX.md                       ← documentation entry point
```

---

## Architecture

> Full diagrams and layer flows: [`docs/architecture.md`](docs/architecture.md)

### Domain A — API Layer

```
BaseApi
  └── UsersApi   (createUser, getUser, getUsers, deleteUser)

AuthenticatedApiClient  → Bearer token per role (fake JWT or real /login)
utils/auth/login.ts     → shared login contract for API client + UI storageState
```

`BaseApi` centralizes HTTP operations and maps non-2xx responses to `ApiError`.  
`AuthenticatedApiClient` creates a pre-authenticated `APIRequestContext` per role.  
All Users API fixtures are wired in `tests/fixtures/api.fixture.ts`.

### Domain A — UI Layer

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

`.env` is **optional** for first run — defaults in `config/env.ts` are enough
for contract, smoke UI, and Conduit public demo. Copy `.env.example` to `.env`
when you need live Users API (`API_BASE_URL`), `PROD_AUTH=true`, or custom
Conduit URLs. Keep real credentials and `QASE_TESTOPS_API_TOKEN` only in `.env`
or CI secrets; `.env` is gitignored.

### Global Setup / Teardown

| Hook | File | Responsibility |
|---|---|---|
| `globalSetup` | `config/global-setup.ts` | Validate config (fail fast on inconsistent `PROD_AUTH` setup) and print a run banner |
| `globalTeardown` | `config/global-teardown.ts` | Remove generated `.playwright/auth` state so stale tokens don't leak across runs |

---

## Test Tags

Every test carries `@smoke` or `@regression` plus a layer tag (`@api`, `@ui`,
`@visual`, `@a11y`). Conduit and security tests add domain tags as needed.

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path, fast feedback |
| `@regression` | Full coverage |
| `@api` | API layer tests |
| `@ui` | Browser tests |
| `@visual` | Screenshot baseline tests |
| `@a11y` | Accessibility (axe-core) tests |
| `@conduit` | RealWorld (Conduit) UI or cross-layer specs |
| `@security` | Security-focused tests (e.g. IDOR contract) |

Run by tag locally:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@api"
npx playwright test --grep "@conduit"
npx playwright test --grep "@security"
npx playwright test --project=ui-chromium --grep "@smoke"
npx playwright test --project=conduit-api
npx playwright test --project=conduit-ui
```

### npm scripts (shortcuts)

| Script | What runs |
|---|---|
| `npm run test:setup` | install Chromium for UI/a11y (one-time after clone) |
| `npm run test:smoke` | contract + a11y + ui-chromium `@smoke` (PR-like, no ReqRes API) |
| `npm run test:smoke:all` | above + `api` `@smoke` (needs `API_BASE_URL` + credentials) |
| `npm run test:smoke:ui` | Todo UI smoke only |
| `npm run test:smoke:api` | Users API smoke only |
| `npm run test:smoke:contract` | contract smoke only |
| `npm run test:contract` / `test:ui` / `test:api` / `test:a11y` / `test:visual` | full project, no tag filter |
| `npm run test:conduit:demo` | Conduit API + UI against public demo |
| `npm run test:conduit:demo:smoke` | Conduit smoke against public demo |
| `npm run test:conduit:smoke` | Docker stack + Conduit API/UI smoke |
| `npm run test:conduit` | Docker stack + full Conduit API/UI + IDOR contract |

---

## RealWorld (Conduit) Live API

> **Conduit file map and decision tree:** [`docs/conduit-map.md`](docs/conduit-map.md)  
> **Recipe for new Conduit tests:** [`docs/cookbooks/add-conduit-flow.md`](docs/cookbooks/add-conduit-flow.md)

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
  `ConduitApiStubServer` in `tests/contract/conduit/` (public demo does not enforce
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

## First run (2 minutes)

Verify the framework after clone — no `.env`, no backend, no Docker:

```bash
npm ci
npm run test:setup          # playwright install chromium (UI/a11y only)
npm run test:contract       # ~30s — stub-server only, no browsers or network
npm run test:smoke          # PR-like: contract + a11y + UI @smoke
```

- **`test:contract`** is the fastest sanity check (Node only).
- **`test:smoke`** matches what `ui-ci` runs on pull requests (minus tag filter on contract).
- **`.env` is not required** for the steps above.

For Firefox/WebKit or all browser deps: `npx playwright install --with-deps`.

---

## Local Usage

### Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 22 | matches CI (`setup-node@v6`); Node 20 may work but is untested |
| npm | use `npm ci` (not `npm install`) for a reproducible lockfile install |
| Network | smoke UI/a11y hit `demo.playwright.dev`; blockers need proxy/VPN config |
| Docker | only for `test:conduit*` / `conduit:up` — not first run |

### What runs where

| Command | Backend | Browsers | `.env` | Notes |
|---|---|---|---|---|
| `npm run test:contract` | in-process stub | no | no | ✅ first verify |
| `npm run test:smoke` | hosted Todo demo | Chromium | no | ✅ PR-like local |
| `npm run test:api` | `API_BASE_URL` | no | yes | not out-of-the-box |
| `npm run test:conduit:demo:smoke` | public Conduit demo | Chromium | no | may flake under load |
| `npm run test:conduit:smoke` | Docker stack | Chromium | URL override | needs Docker |
| `npm test` | all of the above | all projects | varies | full regression — see below |

See **`docs/testing-layers.md`** for the full layer map.

### Run by project

```bash
# Install dependencies (also sets up Husky hooks)
npm ci

# One-time: Chromium for UI / a11y (after clone)
npm run test:setup

# PR-like smoke — recommended daily driver
npm run test:smoke

# Contract only (no backend, no browsers)
npm run test:contract

# Full regression — ALL Playwright projects (api, conduit, 3 browsers, visual, …)
# Expect failures without API_BASE_URL, Docker, or OS-matched visual baselines.
npm test

# UI (Chromium default)
npm run test:ui
npx playwright test --project=ui-firefox
npx playwright test --project=ui-webkit

# Live Users API (needs API_BASE_URL + credentials in .env)
npm run test:api

# Conduit against public demo (no Docker)
npm run test:conduit:demo:smoke

# Conduit against local Docker stack
npm run test:conduit:smoke

# Visual regression (darwin/linux baselines only — skip on Windows)
npm run test:visual
npx playwright test --project=ui-visual --update-snapshots

# Quality
npm run lint
npm run format
npx tsc --noEmit

# Allure report (requires Java 8+ on PATH)
npm run allure:report
```

### Local vs CI

| Local | CI |
|---|---|
| `npm test` runs every project in one command | jobs are split (`ui-ci`, `api-ci`, `conduit-ci`, `visual-ci`) |
| `api` project always included in `npm test` | `api-ci` **skips** when GitHub secrets are missing |
| `ui-visual` included in `npm test` | `visual-ci` **skips** until Linux baselines exist in the repo |

A red `npm test` locally with a green PR is often expected — use `test:smoke` or
target a single `--project=` instead.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Executable doesn't exist at …` | Playwright browsers not installed | `npm run test:setup` or `npx playwright install chromium` |
| `Invalid test configuration` at startup | `PROD_AUTH=true` without `API_BASE_URL` / credentials | set `PROD_AUTH=false` or fill `.env` |
| API tests: connection refused / invalid URL | empty `API_BASE_URL` | don't run `--project=api` without a backend; use `test:contract` |
| Conduit: `ECONNREFUSED 127.0.0.1:3000` | Docker URLs in `.env` but stack not running | `npm run conduit:up` or use public demo URLs |
| Visual: snapshot not found (e.g. Windows) | no baseline for your OS | skip `ui-visual` locally; baselines are darwin/linux only |

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

In CI the `ui-ci` job builds the report from the combined results (contract + UI +
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
2. Run contract tests (no backend/secrets required)
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
