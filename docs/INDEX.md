# Documentation index

Single entry point for navigating the QA framework. Start here if you are
new or looking for a specific layer.

---

## I am new here

1. [README — First run (2 minutes)](../README.md#first-run-2-minutes) —
   `npm ci` → `test:setup` → `test:contract` → `test:smoke` (no `.env`, no backend)
2. [Architecture](./architecture.md) — domains, diagrams, layer flows
3. [Testing layers](./testing-layers.md) — stub-server vs contract vs live API
4. [Playwright projects](../playwright.config.ts) — which `--project=` runs what

---

## I want to add or change tests

**Cookbooks** (step-by-step recipes):

| Recipe | Link |
|---|---|
| Todo UI test | [cookbooks/add-todo-ui-test.md](./cookbooks/add-todo-ui-test.md) |
| Users API endpoint | [cookbooks/add-users-api-endpoint.md](./cookbooks/add-users-api-endpoint.md) |
| Conduit flow (API / UI / cross-layer) | [cookbooks/add-conduit-flow.md](./cookbooks/add-conduit-flow.md) |

Quick lookup by goal:

| Goal | Read first | Key paths |
|---|---|---|
| **Todo UI test** | [Cookbook: Todo UI](./cookbooks/add-todo-ui-test.md) · [POM rule](../.cursor/rules/playwright-pom.mdc) | `tests/ui/todo.spec.ts`, `tests/pages/todo.page.ts`, `tests/fixtures/todo-ui.fixture.ts`, `factories/todo.factory.ts` |
| **Users API (live)** | [Cookbook: Users API](./cookbooks/add-users-api-endpoint.md) | `api/services/users.api.ts`, `tests/api/users.spec.ts`, `tests/fixtures/api.fixture.ts` |
| **Users API (contract)** | [ADR 001](./adr/001-stub-servers-vs-contract-tests.md) | `stub-servers/users-api.stub-server.ts`, `tests/contract/users.contract.spec.ts`, `tests/fixtures/contract.fixture.ts` |
| **Conduit (any layer)** | [Conduit map](./conduit-map.md) | `api/conduit/`, `tests/api/conduit/`, `tests/ui/conduit/`, `tests/fixtures/conduit-*.fixture.ts` |
| **Accessibility** | [README — Accessibility](../README.md#accessibility) | `tests/a11y/`, `tests/fixtures/a11y.fixture.ts` |
| **Visual regression** | [README — Visual Regression](../README.md#visual-regression) | `tests/visual/` |

Reference specs (copy patterns from these):

- UI: `tests/ui/todo.spec.ts`
- Live API: `tests/api/users.spec.ts`
- Contract: `tests/contract/users.contract.spec.ts`
- Cross-layer (Conduit): `tests/ui/conduit/articles.spec.ts`
- Security (IDOR): `tests/contract/conduit/articles-idor.contract.spec.ts`

---

## I want to understand the architecture

| Topic | Document |
|---|---|
| **Domains, diagrams, shared infra** | [architecture.md](./architecture.md) |
| **Conduit file map + decision tree** | [conduit-map.md](./conduit-map.md) |
| Layer matrix (spec folder → backend → project) | [testing-layers.md](./testing-layers.md) |
| **Architecture diagrams + domains** | [architecture.md](./architecture.md) |
| **Conduit file map** | [conduit-map.md](./conduit-map.md) |
| Stub-server rename history | [ADR 001](./adr/001-stub-servers-vs-contract-tests.md) |
| Auth (Todo storageState vs Conduit JWT) | [README — Auth Architecture](../README.md#auth-architecture) |
| CI jobs and tag strategy | [README — CI](../README.md#ci-github-actions) |
| Test tags | [README — Test Tags](../README.md#test-tags) · [tags.md](./tags.md) |

---

## I am debugging a failure

1. [Systematic debugging skill](../.cursor/skills/systematic-debugging/SKILL.md) —
   root-cause workflow before any fix
2. [Context optimization skill](../.cursor/skills/context-optimization/SKILL.md) —
   lean investigation in long sessions
3. [README — Troubleshooting](../README.md#troubleshooting)

Quick commands:

```bash
npx playwright show-report
npx playwright test <spec-file> -g "<test name>" --workers=1
npm run test:contract    # fastest sanity check, no network
```

---

## Folder quick reference

| Path | Role |
|---|---|
| `api/` | Typed HTTP clients (Users API + `api/conduit/` for RealWorld) |
| `stub-servers/` | In-process HTTP implementations for contract tests |
| `tests/contract/` | Contract specs (project `contract`) |
| `tests/api/` | Live API specs (projects `api`, `conduit-api`) |
| `tests/ui/` | Browser specs (projects `ui-*`, `conduit-ui`) |
| `tests/fixtures/` | Custom Playwright fixtures per layer |
| `tests/pages/` | Page Object Model |
| `factories/` | Faker-based test data (mandatory — never inline in specs) |
| `utils/auth/` | Login token, storageState, Conduit session |
| `config/` | Env vars, global setup/teardown |
| `docs/cookbooks/` | Step-by-step recipes for adding tests |

> **Deprecated redirects:** `mocks/` and `tests/mocks/` are legacy pointers only.
> Use `stub-servers/` and `tests/contract/` instead. See [ADR 001](./adr/001-stub-servers-vs-contract-tests.md).
