# Test tags

Every spec carries tags for selective runs in local development and CI.
Combine tags with `--grep` or use the npm scripts below.

---

## Tag reference

| Tag | Meaning | Typical project | npm shortcut |
|---|---|---|---|
| `@smoke` | Critical path, fast feedback | any | `npm run test:smoke` |
| `@regression` | Full coverage | any | `npx playwright test --grep @regression` |
| `@api` | API layer tests | `api`, `conduit-api`, `contract` | `npm run test:smoke:api` |
| `@ui` | Browser tests | `ui-*`, `conduit-ui` | `npm run test:smoke:ui` |
| `@visual` | Screenshot baselines | `ui-visual` | `npm run test:visual` |
| `@a11y` | Accessibility (axe-core) | `ui-a11y` | `npm run test:a11y` |
| `@conduit` | RealWorld (Conduit) specs | `conduit-api`, `conduit-ui` | `npm run test:tags:conduit` |
| `@security` | Security-focused tests (e.g. IDOR) | `contract` | `npm run test:tags:security` |

---

## Run by tag

```bash
# Single tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@conduit"
npx playwright test --grep "@security"

# Combine with project
npx playwright test --project=conduit-api --grep "@smoke"
npx playwright test --project=ui-chromium --grep "@smoke"

# Domain shortcuts
npm run test:conduit:api      # all conduit-api specs
npm run test:conduit:ui       # all conduit-ui specs
npm run test:tags:conduit     # any spec tagged @conduit
npm run test:tags:security    # any spec tagged @security
```

---

## CI tag strategy

| Trigger | Tag filter | Intent |
|---|---|---|
| `pull_request` | `@smoke` | Fast critical-path feedback |
| `push` to `main` | none (full) | Full regression after merge |
| `schedule` (nightly) | none (full) | Catch drift / flakiness |
| `workflow_dispatch` | manual `grep` input | On-demand selective runs |

See [README — CI](../README.md#ci-github-actions) for job breakdown (`ui-ci`, `api-ci`, `conduit-ci`, `visual-ci`).

---

## Tag rules for new tests

1. Every test gets **exactly one** of `@smoke` or `@regression`.
2. Add a **layer tag**: `@api`, `@ui`, `@visual`, or `@a11y`.
3. Conduit specs add `@conduit`.
4. Security contract specs add `@security`.
5. Cross-layer Conduit specs may combine `@ui` + `@conduit` + `@api`.

Example:

```typescript
test.describe('Conduit articles (API)', { tag: ['@api', '@conduit'] }, () => {
  test('creates article', { tag: ['@smoke'] }, async ({ articlesApi }) => { … });
});
```
