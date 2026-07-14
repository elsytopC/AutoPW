import { test, expect } from '@fixtures/conduit.fixture';
import { ConduitArticleFactory } from '@factories/conduit.factory';
import { qase } from 'playwright-qase-reporter';

test.describe('Conduit articles', { tag: ['@api'] }, () => {
  test(
    qase(31, 'creates and reads back an article'),
    { tag: ['@smoke'] },
    async ({ articlesApi, conduitUser }) => {
      const input = ConduitArticleFactory.create();

      const created = await test.step('create article', () =>
        articlesApi.create(input));
      expect(created.title).toBe(input.title);
      expect(created.author.username).toBe(conduitUser.username);
      expect(created.slug).toBeTruthy();

      const fetched = await test.step('read article by slug', () =>
        articlesApi.getBySlug(created.slug));
      expect(fetched.body).toBe(input.body);
      expect(fetched.tagList).toEqual(expect.arrayContaining(input.tagList!));
    },
  );

  test(
    qase(32, 'lists the article under its author'),
    { tag: ['@regression'] },
    async ({ articlesApi, conduitUser }) => {
      const created = await articlesApi.create(ConduitArticleFactory.create());

      const { articles, articlesCount } = await articlesApi.list({
        author: conduitUser.username,
      });

      expect(articlesCount).toBeGreaterThan(0);
      expect(articles.map((a) => a.slug)).toContain(created.slug);
    },
  );

  test(
    qase(33, 'updating the title regenerates the slug'),
    { tag: ['@regression'] },
    async ({ articlesApi }) => {
      const created = await articlesApi.create(ConduitArticleFactory.create());

      const updated = await articlesApi.update(created.slug, {
        title: `Updated ${created.slug}`,
      });

      expect(updated.slug).not.toBe(created.slug);

      // Old slug no longer resolves; new slug does.
      const oldSlugResponse = await articlesApi.tryGetBySlug(created.slug);
      expect(oldSlugResponse.status()).toBe(404);

      const refetched = await articlesApi.getBySlug(updated.slug);
      expect(refetched.title).toBe(updated.title);
    },
  );

  test(
    qase(34, 'deletes an article'),
    { tag: ['@regression'] },
    async ({ articlesApi }) => {
      const created = await articlesApi.create(ConduitArticleFactory.create());

      await articlesApi.remove(created.slug);

      const response = await articlesApi.tryGetBySlug(created.slug);
      expect(response.status()).toBe(404);
    },
  );

  test(
    qase(35, 'rejects article creation without auth (401)'),
    { tag: ['@regression'] },
    async ({ anonArticlesApi }) => {
      const response = await anonArticlesApi.tryCreate(
        ConduitArticleFactory.create(),
      );

      expect(response.status()).toBe(401);
    },
  );

  test(
    qase(36, 'rejects an invalid article with field errors (422)'),
    { tag: ['@regression'] },
    async ({ articlesApi }) => {
      const response = await articlesApi.tryCreate({ title: '' });

      expect(response.status()).toBe(422);

      const body = await response.json();
      expect(body.errors).toMatchObject({
        title: expect.any(Array),
        description: expect.any(Array),
        body: expect.any(Array),
      });
    },
  );

  test(
    qase(44, 'rejects update/delete of an article by a non-owner (IDOR)'),
    { tag: ['@regression', '@security'] },
    async ({ articlesApi, otherUserArticlesApi }) => {
      const created = await test.step('create article as its owner', () =>
        articlesApi.create(ConduitArticleFactory.create()));

      await test.step('update as a different authenticated user', async () => {
        const response = await otherUserArticlesApi.tryUpdate(created.slug, {
          title: 'Hijacked title',
        });
        expect(response.status()).toBe(403);
      });

      await test.step('delete as a different authenticated user', async () => {
        const response = await otherUserArticlesApi.tryRemove(created.slug);
        expect(response.status()).toBe(403);
      });

      await test.step('article is unchanged after both rejected attempts', async () => {
        const stillThere = await articlesApi.getBySlug(created.slug);
        expect(stillThere.title).toBe(created.title);
      });
    },
  );
});
