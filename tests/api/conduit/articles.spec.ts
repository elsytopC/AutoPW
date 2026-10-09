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

        const created = await test.step('create article', () =>
          articlesApi.create(input));

        await test.step('verify created article', () => {
          expect(created.title, 'title matches input').toBe(input.title);
          expect(created.author.username, 'author is the current user').toBe(
            conduitUser.username,
          );
          expect(created.slug, 'slug is generated').toBeTruthy();
        });

        const fetched = await test.step('read article by slug', () =>
          articlesApi.getBySlug(created.slug));

        await test.step('verify body and tags are persisted', () => {
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
        const created = await test.step('create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        const { articles, articlesCount } =
          await test.step('list articles by author', () =>
            articlesApi.list({ author: conduitUser.username }));

        await test.step('verify article is in the author list', () => {
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
        const created = await test.step('create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        const updated = await test.step('update article title', () =>
          articlesApi.update(created.slug, {
            title: `Updated ${created.slug}`,
          }));

        await test.step('verify slug changed and old slug is gone', async () => {
          expect(updated.slug, 'slug changed').not.toBe(created.slug);

          const oldSlugResponse = await articlesApi.tryGetBySlug(created.slug);
          expect(oldSlugResponse.status(), 'old slug status code').toBe(404);
        });

        await test.step('verify article is readable by new slug', async () => {
          const refetched = await articlesApi.getBySlug(updated.slug);
          expect(refetched.title, 'title is updated').toBe(updated.title);
        });
      },
    );

    test(
      qase(34, 'deletes an article'),
      { tag: ['@regression'] },
      async ({ articlesApi }) => {
        const created = await test.step('create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        await test.step('delete article', () =>
          articlesApi.remove(created.slug));

        await test.step('verify article returns 404', async () => {
          const response = await articlesApi.tryGetBySlug(created.slug);
          expect(response.status(), 'status code').toBe(404);
        });
      },
    );

    test(
      qase(35, 'rejects article creation without auth (401)'),
      { tag: ['@regression'] },
      async ({ anonArticlesApi }) => {
        const response = await test.step('create article anonymously', () =>
          anonArticlesApi.tryCreate(ConduitArticleFactory.create()));

        await test.step('verify 401 status', () => {
          expect(response.status(), 'status code').toBe(401);
        });
      },
    );

    test(
      qase(36, 'rejects an invalid article with field errors (422)'),
      { tag: ['@regression'] },
      async ({ articlesApi }) => {
        const response =
          await test.step('create article with empty title', () =>
            articlesApi.tryCreate({ title: '' }));

        await test.step('verify 422 status', () => {
          expect(response.status(), 'status code').toBe(422);
        });

        await test.step('verify errors for required fields', async () => {
          const body = await response.json();
          expect(body.errors, 'errors for required fields').toMatchObject({
            title: expect.any(Array),
            description: expect.any(Array),
            body: expect.any(Array),
          });
        });
      },
    );
  },
);
