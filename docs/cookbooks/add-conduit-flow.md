# Cookbook — add a Conduit flow

Step-by-step recipe for a new RealWorld (Conduit) test — API, UI, or cross-layer.

**Reference specs:**

- Live API: `tests/api/conduit/articles.spec.ts`
- UI-only: `tests/ui/conduit/articles.spec.ts` (second test)
- Cross-layer: `tests/ui/conduit/articles.spec.ts` (first test)
- Security: `tests/contract/conduit/articles-idor.contract.spec.ts`

See also: [conduit-map.md](../conduit-map.md) for the full file layout.

---

## Choose your layer

| Goal | Fixture | Spec folder | Project |
|---|---|---|---|
| API CRUD against real backend | `conduit-api.fixture.ts` | `tests/api/conduit/` | `conduit-api` |
| Browser-only flow | `conduit-ui.fixture.ts` | `tests/ui/conduit/` | `conduit-ui` |
| API seed → UI assert | `conduit-ui.fixture.ts` + inline API | `tests/ui/conduit/` | `conduit-ui` |
| Security the demo won't enforce | `contract.fixture.ts` | `tests/contract/conduit/` | `contract` |

---

## Recipe A — Live API test

### 1. Add service method (if needed)

`api/conduit/services/articles.api.ts` (or relevant service) + Zod model in
`api/conduit/models/`.

### 2. Write the spec

```typescript
import { test, expect } from '@fixtures/conduit-api.fixture';
import { ConduitArticleFactory } from '@factories/conduit.factory';
import { qase } from 'playwright-qase-reporter';

test.describe('Conduit articles (API)', { tag: ['@api', '@conduit'] }, () => {
  test(
    qase(99, 'lists authored articles'),
    { tag: ['@smoke'] },
    async ({ articlesApi, conduitUser }) => {
      const input = ConduitArticleFactory.create();

      await test.step('Create article', async () => {
        await articlesApi.create(input);
      });

      await test.step('Verify in list', async () => {
        const { articles } = await articlesApi.list({
          author: conduitUser.username,
        });
        expect(articles.some((a) => a.title === input.title)).toBe(true);
      });
      // articlesApi fixture deletes authored articles in teardown
    },
  );
});
```

**Key points:**

- `conduitUser` and `articlesApi` are provided by the fixture
- Article cleanup is automatic — no manual delete in the spec
- Use `ConduitArticleFactory` for unique titles (slug collision avoidance)

### 3. Run

```bash
npx playwright test tests/api/conduit/ --project=conduit-api --workers=1
# Or with Docker:
npm run test:conduit:smoke
```

---

## Recipe B — UI-only test

### 1. Add page method (if needed)

`tests/pages/conduit/` — keep locators in the Page Object.

### 2. Write the spec

```typescript
import { test, expect } from '@fixtures/conduit-ui.fixture';
import { ConduitUserFactory, ConduitArticleFactory } from '@factories/conduit.factory';
import { qase } from 'playwright-qase-reporter';

test.describe('Conduit articles (UI)', { tag: ['@ui', '@conduit'] }, () => {
  test(
    qase(99, 'publishes article via editor'),
    { tag: ['@regression'] },
    async ({ conduitRegister, conduitEditor, conduitArticle, page }) => {
      const userData = ConduitUserFactory.create();
      const articleData = ConduitArticleFactory.create();

      await test.step('Register via UI', async () => {
        await conduitRegister.goto();
        await conduitRegister.register(userData);
        await expect(page).toHaveURL('/');
      });

      await test.step('Publish via editor', async () => {
        await conduitEditor.goto();
        await conduitEditor.publishArticle(articleData);
      });

      await expect(conduitArticle.title).toHaveText(articleData.title);
    },
  );
});
```

### 3. Run

```bash
npx playwright test tests/ui/conduit/ --project=conduit-ui --workers=1
```

---

## Recipe C — Cross-layer (API seed → UI assert)

Use when the UI state is easier to set up via API than through multiple UI clicks.

```typescript
import { test, expect } from '@fixtures/conduit-ui.fixture';
import { ConduitArticleFactory, ConduitUserFactory } from '@factories/conduit.factory';
import { createConduitContext } from '@api/conduit/client/conduitClient';
import { ConduitAuthApi } from '@api/conduit/services/auth.api';
import { ArticlesApi } from '@api/conduit/services/articles.api';
import { authenticateConduitUser } from '@utils/auth/conduit.session';
import { qase } from 'playwright-qase-reporter';

test(
  qase(99, 'API-created article visible in browser'),
  { tag: ['@smoke', '@ui', '@conduit'] },
  async ({ conduitArticle, page }) => {
    const input = ConduitArticleFactory.create();

    const { user, article } = await test.step('Create via API', async () => {
      const ctx = await createConduitContext();
      try {
        const user = await new ConduitAuthApi(ctx).register(
          ConduitUserFactory.create(),
        );
        const apiCtx = await createConduitContext(user.token);
        try {
          const article = await new ArticlesApi(apiCtx).create(input);
          return { user, article };
        } finally {
          await apiCtx.dispose();
        }
      } finally {
        await ctx.dispose();
      }
    });

    await authenticateConduitUser(page, user);
    await conduitArticle.goto(article.slug);
    await expect(conduitArticle.title).toHaveText(input.title);
  },
);
```

---

## Recipe D — Security / IDOR contract

When the public demo does not enforce owner-only access, test against the stub:

```typescript
// tests/contract/conduit/articles-idor.contract.spec.ts
// Uses conduitApiStub from @fixtures/contract.fixture
// Assert 403 when non-owner tries update/delete
```

Add handler logic in `stub-servers/conduit-api.stub-server.ts`.

---

## Checklist

- [ ] Chosen correct layer (see decision tree in [conduit-map.md](../conduit-map.md))
- [ ] Test data via `ConduitUserFactory` / `ConduitArticleFactory`
- [ ] Correct fixture import (`conduit-api`, `conduit-ui`, or `contract`)
- [ ] `Token` auth for API — not `Bearer`
- [ ] UI auth via `authenticateConduitUser` when seeding via API
- [ ] Tags: `@conduit` + layer tag; `@security` for IDOR tests
- [ ] Targeted `--project=` run passes
