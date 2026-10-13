import { test, expect } from '@fixtures/conduit-ui.fixture';
import {
  ConduitArticleFactory,
  ConduitUserFactory,
} from '@factories/conduit.factory';
import { behavior } from '@utils/allure';
import { authenticateConduitUser } from '@utils/auth/conduit.session';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'Conduit articles (API + UI)',
  {
    tag: ['@ui', '@conduit', '@api'],
    annotation: behavior('Conduit', 'Articles'),
  },
  () => {
    test(
      qase(37, 'article created via API is visible in the browser'),
      { tag: ['@smoke', '@showcase'] },
      async ({ conduitArticle, conduitUser, articlesApi, page }) => {
        const input = ConduitArticleFactory.create();

        const created = await test.step('Create article via API', () =>
          articlesApi.create(input));

        await test.step('Authenticate browser session', () =>
          authenticateConduitUser(page, conduitUser));

        await conduitArticle.goto(created.slug);

        await test.step('Verify title and body are rendered', async () => {
          await expect(conduitArticle.title, 'article title').toHaveText(
            input.title,
          );
          await expect(
            conduitArticle.bodySnippet(input.body),
            'article body is shown',
          ).toBeVisible();
        });
      },
    );
  },
);

test.describe(
  'Conduit articles (UI)',
  { tag: ['@ui', '@conduit'], annotation: behavior('Conduit', 'Articles') },
  () => {
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

        await test.step('Register via UI', async () => {
          await conduitRegister.goto();
          await conduitRegister.register(userData);
          await expect(page, 'redirected to home feed').toHaveURL('/');
        });

        await test.step('Compose and publish', async () => {
          await conduitEditor.goto();
          await conduitEditor.publishArticle(articleData);
        });

        await test.step('Verify published article page', async () => {
          await conduitArticle.expectPathname(/^\/article\/[^/]+$/);
          await expect(conduitArticle.title, 'article title').toHaveText(
            articleData.title,
          );
          await expect(
            conduitArticle.bodySnippet(articleData.body),
            'article body is shown',
          ).toBeVisible();

          if (articleData.tagList?.length) {
            for (const tag of articleData.tagList) {
              await expect(
                conduitArticle.tag(tag),
                `tag "${tag}" is shown`,
              ).toBeVisible();
            }
          }
        });
      },
    );
  },
);
