import { test, expect } from '@fixtures/conduit.fixture';
import {
  ConduitArticleFactory,
  ConduitCommentFactory,
} from '@factories/conduit.factory';
import { qase } from 'playwright-qase-reporter';

test.describe('Conduit comments', { tag: ['@api'] }, () => {
  test(
    qase(39, 'adds a comment to an article'),
    { tag: ['@smoke'] },
    async ({ articlesApi, commentsApi, conduitUser }) => {
      const article = await test.step('create article', () =>
        articlesApi.create(ConduitArticleFactory.create()));
      const input = ConduitCommentFactory.create();

      const comment = await test.step('add comment', () =>
        commentsApi.add(article.slug, input.body));

      expect(comment.body).toBe(input.body);
      expect(comment.author.username).toBe(conduitUser.username);
    },
  );

  test(
    qase(40, 'lists comments for an article'),
    { tag: ['@regression'] },
    async ({ articlesApi, commentsApi }) => {
      const article = await articlesApi.create(ConduitArticleFactory.create());
      const first = ConduitCommentFactory.create();
      const second = ConduitCommentFactory.create();

      await commentsApi.add(article.slug, first.body);
      await commentsApi.add(article.slug, second.body);

      const comments = await commentsApi.list(article.slug);

      expect(comments.length).toBeGreaterThanOrEqual(2);
      expect(comments.map((c) => c.body)).toEqual(
        expect.arrayContaining([first.body, second.body]),
      );
    },
  );

  test(
    qase(41, 'deletes a comment'),
    { tag: ['@regression'] },
    async ({ articlesApi, commentsApi }) => {
      const article = await articlesApi.create(ConduitArticleFactory.create());
      const comment = await commentsApi.add(
        article.slug,
        ConduitCommentFactory.create().body,
      );

      await commentsApi.remove(article.slug, comment.id);

      const comments = await commentsApi.list(article.slug);
      expect(comments.map((c) => c.id)).not.toContain(comment.id);
    },
  );

  test(
    qase(42, 'rejects commenting without auth (401)'),
    { tag: ['@regression'] },
    async ({ articlesApi, anonCommentsApi }) => {
      const article = await articlesApi.create(ConduitArticleFactory.create());

      const response = await anonCommentsApi.tryAdd(article.slug, {
        body: 'should not be allowed',
      });

      expect(response.status()).toBe(401);
    },
  );

  test(
    qase(43, 'returns an error when commenting on a missing article'),
    { tag: ['@regression'] },
    async ({ commentsApi }) => {
      const response = await commentsApi.tryAdd('non-existent-slug-xyz-000', {
        body: 'orphan comment',
      });

      expect(response.status()).toBe(404);
    },
  );
});
