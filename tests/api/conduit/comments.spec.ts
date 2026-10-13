import { test, expect } from '@fixtures/conduit-api.fixture';
import {
  ConduitArticleFactory,
  ConduitCommentFactory,
} from '@factories/conduit.factory';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'Conduit comments',
  { tag: ['@api'], annotation: behavior('Conduit', 'Comments') },
  () => {
    test(
      qase(39, 'adds a comment to an article'),
      { tag: ['@smoke'] },
      async ({ articlesApi, commentsApi, conduitUser }) => {
        const article = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));
        const input = ConduitCommentFactory.create();

        const comment = await test.step('Add comment', () =>
          commentsApi.add(article.slug, input.body));

        await test.step('Verify comment body and author', () => {
          expect(comment.body, 'comment body matches input').toBe(input.body);
          expect(comment.author.username, 'author is the current user').toBe(
            conduitUser.username,
          );
        });
      },
    );

    test(
      qase(40, 'lists comments for an article'),
      { tag: ['@regression'] },
      async ({ articlesApi, commentsApi }) => {
        const article = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));
        const first = ConduitCommentFactory.create();
        const second = ConduitCommentFactory.create();

        await test.step('Add two comments', async () => {
          await commentsApi.add(article.slug, first.body);
          await commentsApi.add(article.slug, second.body);
        });

        const comments = await test.step('List comments', () =>
          commentsApi.list(article.slug));

        await test.step('Verify both comments are listed', () => {
          expect(comments.length, 'comments count').toBeGreaterThanOrEqual(2);
          expect(
            comments.map((c) => c.body),
            'list contains both comments',
          ).toEqual(expect.arrayContaining([first.body, second.body]));
        });
      },
    );

    test(
      qase(41, 'deletes a comment'),
      { tag: ['@regression'] },
      async ({ articlesApi, commentsApi }) => {
        const article = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));
        const comment = await test.step('Add comment', () =>
          commentsApi.add(article.slug, ConduitCommentFactory.create().body));

        await test.step('Delete comment', () =>
          commentsApi.remove(article.slug, comment.id));

        await test.step('Verify comment is no longer listed', async () => {
          const comments = await commentsApi.list(article.slug);
          expect(
            comments.map((c) => c.id),
            'deleted comment is absent',
          ).not.toContain(comment.id);
        });
      },
    );

    test(
      qase(42, 'rejects commenting without auth (401)'),
      { tag: ['@regression'] },
      async ({ articlesApi, anonCommentsApi }) => {
        const article = await test.step('Create article', () =>
          articlesApi.create(ConduitArticleFactory.create()));

        const response = await test.step('Add comment anonymously', () =>
          anonCommentsApi.tryAdd(article.slug, {
            body: 'should not be allowed',
          }));

        await test.step('Verify 401 status', () => {
          expect(response.status(), 'status code').toBe(401);
        });
      },
    );

    test(
      qase(43, 'returns an error when commenting on a missing article'),
      { tag: ['@regression'] },
      async ({ commentsApi }) => {
        const response =
          await test.step('Add comment to a missing article', () =>
            commentsApi.tryAdd('non-existent-slug-xyz-000', {
              body: 'orphan comment',
            }));

        await test.step('Verify 404 status', () => {
          expect(response.status(), 'status code').toBe(404);
        });
      },
    );
  },
);
