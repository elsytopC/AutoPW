# QA Framework (Playwright + TypeScript)

Lightweight SDET automation framework for UI and API testing with a focus on:

- clear test architecture;
- typed API abstractions;
- isolated test data and fixtures;
- predictable CI behavior without overengineering.

## What Is Included

- **UI tests** with `@playwright/test` in the `ui-chromium` project.
- **API tests** built on `APIRequestContext` and service classes (`BaseApi`, `UsersApi`, `AuthApi`).
- **UI auth-state bootstrap** via setup project that generates `storageState`.
- **Mock layer** for isolated tests without network dependency (`UsersMock`).
- **Code quality** with TypeScript, ESLint flat config, Prettier, Husky, and lint-staged.

## Project Structure

```text
api/
  client/authenticatedApiClient.ts
  core/baseApi.ts
  errors/api.error.ts
  models/*.model.ts
  services/*.api.ts
factories/
  user.factory.ts
mocks/
  users.mock.ts
tests/
  api/users.spec.ts
  mocks/users.mock.spec.ts
  ui/example.spec.ts
  auth/*.setup.ts
  fixtures/*.fixture.ts
utils/auth/
  authManager.ts
  auth.config.ts
  auth.types.ts
  tokenUtils.ts
playwright.config.ts
.github/workflows/playwright.yml
```

## API Layer Design

- `BaseApi` centralizes HTTP operations (`get/post/patch/put/delete`) and response/error handling.
- Domain services (`UsersApi`, `AuthApi`) expose business-level API actions.
- `ApiError` provides unified error payload (status, body, message context).
- Fixtures wire services into tests through a single API context (`tests/fixtures/api.fixture.ts`).

This keeps API tests consistent and reduces request/validation duplication.

## Auth and UI storageState

- Setup test `tests/auth/admin.setup.ts` calls `ensureAuthenticated('admin')`.
- `authManager` creates `.playwright/auth/admin.json`.
- `ui-chromium` consumes this file via `storageState` before UI specs run.

### Auth Modes

- `PROD_AUTH=true`  
  Performs real authentication via `API_BASE_URL/login` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- `PROD_AUTH=false`  
  Uses a fallback JWT generation flow for stable local/CI execution without external auth.

## Environment Configuration

The framework loads environment variables from `.env` via `dotenv`.

Key variables:

- `API_BASE_URL`
- `PROD_AUTH`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `USER_EMAIL`
- `USER_PASSWORD`
- Optional for UI state origin: `BASE_URL` or `UI_BASE_URL`

## Local Usage

Install dependencies:

```bash
npm ci
```

Run all tests:

```bash
npm test
```

Run UI only:

```bash
npx playwright test --project=ui-chromium
```

Run API only:

```bash
npx playwright test --project=api
```

Run lint:

```bash
npm run lint
```

Run formatter:

```bash
npm run format
```

## CI (GitHub Actions)

Workflow file: `.github/workflows/playwright.yml`

- `ui-ci`  
  Always runs `ui-chromium` and uploads `playwright-report-ui`.

- `api-ci`  
  Runs in controlled mode:
  - if secrets `API_BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` are set, API tests are executed;
  - if secrets are missing, the job is skipped gracefully with an informative message.

When API tests run, the artifact is uploaded as `playwright-report-api`.

## Current State and Next Evolution

The framework already provides a solid API/UI foundation. Practical next steps:

- evolve mock tests toward stronger contract-level behavior;
- add test tags (`@smoke`, `@regression`, `@api`, `@ui`) for selective CI runs;
- expand the UI layer with page objects when real product UI flows are available.
