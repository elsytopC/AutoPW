import type { APIRequestContext } from '@playwright/test';
import { test as base } from '@fixtures/base.fixture';

import {
  createConduitContext,
  ConduitAuthApi,
  ArticlesApi,
  CommentsApi,
} from '@api/conduit';
import type { ArticlesResponse, ConduitUser, LoginRequest } from '@api/conduit';
import { ConduitUserFactory } from '@factories/conduit.factory';

type ConduitCleanup = {
  trackUser: (credentials: LoginRequest) => void;
};

type ConduitFixtures = {
  conduitUser: ConduitUser;
  anonAuthApi: ConduitAuthApi;
  articlesApi: ArticlesApi;
  anonArticlesApi: ArticlesApi;
  commentsApi: CommentsApi;
  anonCommentsApi: CommentsApi;
  conduitCleanup: ConduitCleanup;
};

async function withConduitContext<T>(
  body: (context: APIRequestContext) => Promise<T>,
  token?: string,
): Promise<T> {
  const context = await createConduitContext(token);
  try {
    return await body(context);
  } finally {
    await context.dispose();
  }
}

async function deleteArticlesByAuthor(
  api: ArticlesApi,
  username: string,
): Promise<void> {
  let articles: ArticlesResponse['articles'];
  try {
    ({ articles } = await api.list({ author: username, limit: '100' }));
  } catch (error) {
    console.warn(`Failed to list articles of "${username}": ${error}`);
    return;
  }
  // Sequential deletes — shared demo backend cannot handle parallel teardown
  for (const article of articles) {
    try {
      await api.remove(article.slug);
    } catch (error) {
      console.warn(`Failed to clean up article "${article.slug}": ${error}`);
    }
  }
}

export const test = base.extend<ConduitFixtures>({
  conduitUser: ({}, use) =>
    withConduitContext(async (context) => {
      const auth = new ConduitAuthApi(context);
      await use(await auth.register(ConduitUserFactory.create()));
    }),

  anonAuthApi: ({}, use) =>
    withConduitContext((context) => use(new ConduitAuthApi(context))),

  articlesApi: ({ conduitUser }, use) =>
    withConduitContext(async (context) => {
      const api = new ArticlesApi(context);
      await use(api);
      await deleteArticlesByAuthor(api, conduitUser.username);
    }, conduitUser.token),

  anonArticlesApi: ({}, use) =>
    withConduitContext((context) => use(new ArticlesApi(context))),

  commentsApi: ({ conduitUser }, use) =>
    withConduitContext(
      (context) => use(new CommentsApi(context)),
      conduitUser.token,
    ),

  anonCommentsApi: ({}, use) =>
    withConduitContext((context) => use(new CommentsApi(context))),

  // Users created outside the API fixtures (e.g. via the register form) have no
  // token in the test — log in during teardown to delete what they authored.
  conduitCleanup: async ({}, use) => {
    const tracked: LoginRequest[] = [];
    await use({ trackUser: (credentials) => tracked.push(credentials) });

    for (const credentials of tracked) {
      try {
        const user = await withConduitContext((context) =>
          new ConduitAuthApi(context).login(credentials),
        );
        await withConduitContext(
          (context) =>
            deleteArticlesByAuthor(new ArticlesApi(context), user.username),
          user.token,
        );
      } catch (error) {
        console.warn(
          `Failed to clean up data of "${credentials.email}": ${error}`,
        );
      }
    }
  },
});

export { expect } from '@playwright/test';
