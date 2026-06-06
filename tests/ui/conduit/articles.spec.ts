import { test } from '@fixtures/conduit.fixture';
import {
  test as uiTest,
  expect as uiExpect,
} from '@fixtures/conduit-ui.fixture';
import {
  ConduitArticleFactory,
  ConduitUserFactory,
} from '@factories/conduit.factory';
import { authenticateConduitUser } from '@utils/auth/conduit.session';
import { ConduitArticlePage } from '@pages/conduit/article.page';

test.describe(
  'Conduit articles (API + UI)',
  { tag: ['@ui', '@conduit', '@api'] },
  () => {
    test(
      'article created via API is visible in the browser',
      { tag: ['@smoke'] },
      async ({ articlesApi, conduitUser, page }) => {
        const input = ConduitArticleFactory.create();

        const created = await test.step('create article via API', () =>
          articlesApi.create(input));

        // Inject the JWT before navigation so we skip the login form.
        await authenticateConduitUser(page, conduitUser);

        const articlePage = new ConduitArticlePage(page);
        await test.step('open article in browser', () =>
          articlePage.goto(created.slug));

        await articlePage.expectTitle(input.title);
        await articlePage.expectBody(input.body);
      },
    );
  },
);

uiTest.describe('Conduit articles (UI)', { tag: ['@ui', '@conduit'] }, () => {
  uiTest(
    'publishes an article through the editor',
    { tag: ['@regression'] },
    async ({ conduitRegister, conduitEditor, conduitArticle, page }) => {
      const userData = ConduitUserFactory.create();
      const articleData = ConduitArticleFactory.create();

      await test.step('register via UI', async () => {
        await conduitRegister.goto();
        await conduitRegister.register(userData);
        await uiExpect(page).toHaveURL('/');
      });

      await test.step('compose and publish', async () => {
        await conduitEditor.goto();
        await conduitEditor.publishArticle(articleData);
      });

      // Router lands on `/article/{slug}` after publish.
      await uiExpect(page).toHaveURL(/\/article\/.+/);
      await conduitArticle.expectTitle(articleData.title);
      await conduitArticle.expectBody(articleData.body);

      if (articleData.tagList?.length) {
        for (const tag of articleData.tagList) {
          await conduitArticle.expectTag(tag);
        }
      }
    },
  );
});
