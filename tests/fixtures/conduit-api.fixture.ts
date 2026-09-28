import { test as base } from '@playwright/test';

import {
  createConduitContext,
  ConduitAuthApi,
  ArticlesApi,
  CommentsApi,
  ConduitUser,
  LoginRequest,
} from '@api/conduit';
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

async function deleteArticlesByAuthor(
  api: ArticlesApi,
  username: string,
): Promise<void> {
  const { articles } = await api.list({ author: username, limit: '100' });
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
  conduitUser: async ({}, use) => {
    const context = await createConduitContext();
    try {
      const auth = new ConduitAuthApi(context);
      const user = await auth.register(ConduitUserFactory.create());
      await use(user);
    } finally {
      await context.dispose();
    }
  },

  anonAuthApi: async ({}, use) => {
    const context = await createConduitContext();
    try {
      await use(new ConduitAuthApi(context));
    } finally {
      await context.dispose();
    }
  },

  articlesApi: async ({ conduitUser }, use) => {
    const context = await createConduitContext(conduitUser.token);
    try {
      const api = new ArticlesApi(context);
      await use(api);
      await deleteArticlesByAuthor(api, conduitUser.username);
    } finally {
      await context.dispose();
    }
  },

  anonArticlesApi: async ({}, use) => {
    const context = await createConduitContext();
    try {
      await use(new ArticlesApi(context));
    } finally {
      await context.dispose();
    }
  },

  commentsApi: async ({ conduitUser }, use) => {
    const context = await createConduitContext(conduitUser.token);
    try {
      await use(new CommentsApi(context));
    } finally {
      await context.dispose();
    }
  },

  anonCommentsApi: async ({}, use) => {
    const context = await createConduitContext();
    try {
      await use(new CommentsApi(context));
    } finally {
      await context.dispose();
    }
  },

  // Users created outside the API fixtures (e.g. via the register form) have no
  // token in the test — log in during teardown to delete what they authored.
  conduitCleanup: async ({}, use) => {
    const tracked: LoginRequest[] = [];
    await use({ trackUser: (credentials) => tracked.push(credentials) });

    for (const credentials of tracked) {
      const anonContext = await createConduitContext();
      try {
        const user = await new ConduitAuthApi(anonContext).login(credentials);
        const userContext = await createConduitContext(user.token);
        try {
          await deleteArticlesByAuthor(
            new ArticlesApi(userContext),
            user.username,
          );
        } finally {
          await userContext.dispose();
        }
      } catch (error) {
        console.warn(
          `Failed to clean up data of "${credentials.email}": ${error}`,
        );
      } finally {
        await anonContext.dispose();
      }
    }
  },
});

export { expect } from '@playwright/test';
