import { test, expect } from '@fixtures/conduit-api.fixture';
import { ConduitArticleFactory } from '@factories/conduit.factory';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'Conduit articles',
  { tag: ['@api'], annotation: behavior('Conduit', 'Articles') },
  () => {
    test(
      qase(31, 'creates and reads back an article'),
      { tag: ['@smoke'] },
      async ({ articlesApi, conduitUser }) => {
        const input = ConduitArticleFactory.create();

        const created = await test.step('Create article', () =>
          articlesApi.create(input));

        await test.step('Verify created article', () => {
          expect(created.title, 'title matches input').toBe(input.title);
          expect(created.author.username, 'author is the current user').toBe(
            conduitUser.username,
          );
          expect(created.slug, 'slug is generated').toBeTruthy();
        });

        const fetched = await test.step('Read article by slug', () =>
          articlesApi.getBySlug(created.slug));

        await test.step('Verify body and tags are persisted', () => {
          expect(fetched.body, 'body matches input').toBe(input.body);
          expect(fetched.tagList, 'tags include input tags').toEqual(
            expect.arrayContaining(input.tagList!),
          );
        });
      },
    );

    test(
      qase(32, 'lists the article under its author'),
      { tag: ['@regression'] },
      async ({ articlesApi, conduitUser }) => {
        const created = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        const { articles, articlesCount } =
          await test.step('List articles by author', () =>
            articlesApi.list({ author: conduitUser.username }));

        await test.step('Verify article is in the author list', () => {
          expect(articlesCount, 'author has articles').toBeGreaterThan(0);
          expect(
            articles.map((a) => a.slug),
            'list contains created article',
          ).toContain(created.slug);
        });
      },
    );

    test(
      qase(33, 'updating the title regenerates the slug'),
      { tag: ['@regression'] },
      async ({ articlesApi }) => {
        const created = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        const updated = await test.step('Update article title', () =>
          articlesApi.update(created.slug, {
            title: `Updated ${created.slug}`,
          }));

        await test.step('Verify slug changed and old slug is gone', async () => {
          expect(updated.slug, 'slug changed').not.toBe(created.slug);

          const oldSlugResponse = await articlesApi.tryGetBySlug(created.slug);
          expect(oldSlugResponse.status(), 'old slug status code').toBe(404);
        });

        await test.step('Verify article is readable by new slug', async () => {
          const refetched = await articlesApi.getBySlug(updated.slug);
          expect(refetched.title, 'title is updated').toBe(updated.title);
        });
      },
    );

    test(
      qase(34, 'deletes an article'),
      { tag: ['@regression'] },
      async ({ articlesApi }) => {
        const created = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        await test.step('Delete article', () =>
          articlesApi.remove(created.slug));

        await test.step('Verify article returns 404', async () => {
          const response = await articlesApi.tryGetBySlug(created.slug);
          expect(response.status(), 'status code').toBe(404);
        });
      },
    );

    test(
      qase(35, 'rejects article creation without auth (401)'),
      { tag: ['@regression'] },
      async ({ anonArticlesApi }) => {
        const response = await test.step('Create article anonymously', () =>
          anonArticlesApi.tryCreate(ConduitArticleFactory.create()));

        await test.step('Verify 401 status', () => {
          expect(response.status(), 'status code').toBe(401);
        });
      },
    );

    test(
      qase(36, 'rejects an invalid article with field errors (422)'),
      { tag: ['@regression'] },
      async ({ articlesApi }) => {
        const response =
          await test.step('Create article with empty title', () =>
            articlesApi.tryCreate({ title: '' }));

        await test.step('Verify 422 status', () => {
          expect(response.status(), 'status code').toBe(422);
        });

        await test.step('Verify errors for required fields', async () => {
          const body = await response.json();
          expect(body.errors, 'errors for required fields').toMatchObject({
            title: expect.any(Array),
            description: expect.any(Array),
            body: expect.any(Array),
          });
        });
      },
    );

    test(
      qase(49, 'lists the article under its tag'),
      { tag: ['@smoke'] },
      async ({ articlesApi }) => {
        const uniqueTag = ConduitArticleFactory.uniqueTag();
        const createdArticle =
          await test.step('Create article with a unique tag', () =>
            articlesApi.create(
              ConduitArticleFactory.create({ tagList: [uniqueTag] }),
            ));

        const articlesWithTag =
          await test.step('List articles by that tag', () =>
            articlesApi.list({ tag: uniqueTag }));

        await test.step('Verify the article is in the tag list', () => {
          expect(
            articlesWithTag.articles.map((article) => article.slug),
            'list contains the created article',
          ).toContain(createdArticle.slug);
        });
      },
    );

    test(
      qase(50, 'rejects article update and delete without auth (401)'),
      { tag: ['@smoke'] },
      async ({ articlesApi, anonArticlesApi }) => {
        const createdArticle = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        await test.step('Update without a token', async () => {
          const anonymousUpdate = await anonArticlesApi.tryUpdate(
            createdArticle.slug,
            { title: `Hijacked ${createdArticle.slug}` },
          );
          expect(anonymousUpdate.status(), 'update status code').toBe(401);
        });

        await test.step('Delete without a token', async () => {
          const anonymousDelete = await anonArticlesApi.tryRemove(
            createdArticle.slug,
          );
          expect(anonymousDelete.status(), 'delete status code').toBe(401);
        });

        await test.step('Verify the article is unchanged', async () => {
          const storedArticle = await articlesApi.getBySlug(
            createdArticle.slug,
          );
          expect(storedArticle.title, 'title is unchanged').toBe(
            createdArticle.title,
          );
        });
      },
    );
  },
);
