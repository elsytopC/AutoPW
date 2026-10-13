import { request } from '@playwright/test';
import { test, expect } from '@fixtures/contract.fixture';
import { ConduitAuthApi, ArticlesApi } from '@api/conduit';
import {
  ConduitUserFactory,
  ConduitArticleFactory,
} from '@factories/conduit.factory';
import { behavior } from '@utils/allure';
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
  {
    tag: ['@api', '@contract'],
    annotation: behavior('Conduit', 'Authorization'),
  },
  () => {
    test(
      qase(44, 'rejects update/delete of an article by a non-owner (IDOR)'),
      { tag: ['@regression', '@security'] },
      async ({ conduitApiStub }) => {
        const [owner, other] =
          await test.step('Register owner and another user', async () => [
            await registerUser(conduitApiStub.baseURL),
            await registerUser(conduitApiStub.baseURL),
          ]);

        const ownerCtx = await articlesApi(conduitApiStub.baseURL, owner.token);
        const otherCtx = await articlesApi(conduitApiStub.baseURL, other.token);

        try {
          const ownerApi = new ArticlesApi(ownerCtx);
          const otherApi = new ArticlesApi(otherCtx);

          const created = await test.step('Create article as its owner', () =>
            ownerApi.create(ConduitArticleFactory.create()));

          await test.step('Update as a different authenticated user', async () => {
            const response = await otherApi.tryUpdate(created.slug, {
              title: 'Hijacked title',
            });
            expect(response.status(), 'non-owner gets 403').toBe(403);
          });

          await test.step('Delete as a different authenticated user', async () => {
            const response = await otherApi.tryRemove(created.slug);
            expect(response.status(), 'non-owner gets 403').toBe(403);
          });

          await test.step('Article is unchanged after both rejected attempts', async () => {
            const stillThere = await ownerApi.getBySlug(created.slug);
            expect(stillThere.title, 'title is unchanged').toBe(created.title);
          });
        } finally {
          await ownerCtx.dispose();
          await otherCtx.dispose();
        }
      },
    );
  },
);
