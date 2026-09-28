import { test, expect } from '@fixtures/conduit-ui.fixture';
import {
  ConduitArticleFactory,
  ConduitUserFactory,
} from '@factories/conduit.factory';
import { authenticateConduitUser } from '@utils/auth/conduit.session';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'Conduit articles (API + UI)',
  { tag: ['@ui', '@conduit', '@api'] },
  () => {
    test(
      qase(37, 'article created via API is visible in the browser'),
      { tag: ['@smoke', '@showcase'] },
      async ({ conduitArticle, conduitUser, articlesApi, page }) => {
        const input = ConduitArticleFactory.create();

        const created = await test.step('create article via API', () =>
          articlesApi.create(input));

        await authenticateConduitUser(page, conduitUser);

        await test.step('open article in browser', () =>
          conduitArticle.goto(created.slug));

        await expect(conduitArticle.title).toHaveText(input.title);
        await expect(conduitArticle.bodySnippet(input.body)).toBeVisible();
      },
    );
  },
);

test.describe('Conduit articles (UI)', { tag: ['@ui', '@conduit'] }, () => {
  test(
    qase(38, 'publishes an article through the editor'),
    { tag: ['@regression'] },
    async ({
      conduitRegister,
      conduitEditor,
      conduitArticle,
      conduitCleanup,
      page,
    }) => {
      const userData = ConduitUserFactory.create();
      const articleData = ConduitArticleFactory.create();
      conduitCleanup.trackUser({
        email: userData.email,
        password: userData.password,
      });

      await test.step('register via UI', async () => {
        await conduitRegister.goto();
        await conduitRegister.register(userData);
        await expect(page).toHaveURL('/');
      });

      await test.step('compose and publish', async () => {
        await conduitEditor.goto();
        await conduitEditor.publishArticle(articleData);
      });

      await conduitArticle.expectPathname(/^\/article\/[^/]+$/);
      await expect(conduitArticle.title).toHaveText(articleData.title);
      await expect(conduitArticle.bodySnippet(articleData.body)).toBeVisible();

      if (articleData.tagList?.length) {
        for (const tag of articleData.tagList) {
          await expect(conduitArticle.tag(tag)).toBeVisible();
        }
      }
    },
  );
});
