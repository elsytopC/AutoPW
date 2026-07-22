import { request } from '@playwright/test';
import { test, expect } from '@fixtures/contract.fixture';
import { ConduitAuthApi } from '@api/conduit/services/auth.api';
import { ArticlesApi } from '@api/conduit/services/articles.api';
import {
  ConduitUserFactory,
  ConduitArticleFactory,
} from '@factories/conduit.factory';
import { qase } from 'playwright-qase-reporter';

async function registerUser(baseURL: string) {
  const context = await request.newContext({ baseURL: `${baseURL}/` });
  try {
    return await new ConduitAuthApi(context).register(
      ConduitUserFactory.create(),
    );
  } finally {
    await context.dispose();
  }
}

function articlesApi(baseURL: string, token: string) {
  return request.newContext({
    baseURL: `${baseURL}/`,
    extraHTTPHeaders: { Authorization: `Token ${token}` },
  });
}

test.describe(
  'Conduit articles authorization (contract)',
  { tag: ['@api'] },
  () => {
    test(
      qase(44, 'rejects update/delete of an article by a non-owner (IDOR)'),
      { tag: ['@regression', '@security'] },
      async ({ conduitApiStub }) => {
        const owner = await registerUser(conduitApiStub.baseURL);
        const other = await registerUser(conduitApiStub.baseURL);

        const ownerCtx = await articlesApi(conduitApiStub.baseURL, owner.token);
        const otherCtx = await articlesApi(conduitApiStub.baseURL, other.token);

        try {
          const ownerApi = new ArticlesApi(ownerCtx);
          const otherApi = new ArticlesApi(otherCtx);

          const created = await test.step('create article as its owner', () =>
            ownerApi.create(ConduitArticleFactory.create()));

          await test.step('update as a different authenticated user', async () => {
            const response = await otherApi.tryUpdate(created.slug, {
              title: 'Hijacked title',
            });
            expect(response.status()).toBe(403);
          });

          await test.step('delete as a different authenticated user', async () => {
            const response = await otherApi.tryRemove(created.slug);
            expect(response.status()).toBe(403);
          });

          await test.step('article is unchanged after both rejected attempts', async () => {
            const stillThere = await ownerApi.getBySlug(created.slug);
            expect(stillThere.title).toBe(created.title);
          });
        } finally {
          await ownerCtx.dispose();
          await otherCtx.dispose();
        }
      },
    );
  },
);
