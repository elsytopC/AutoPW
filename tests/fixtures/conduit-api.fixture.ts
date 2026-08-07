import { test as base } from '@playwright/test';

import {
  createConduitContext,
  ConduitAuthApi,
  ArticlesApi,
  CommentsApi,
  ConduitUser,
} from '@api/conduit';
import { ConduitUserFactory } from '@factories/conduit.factory';

type ConduitFixtures = {
  conduitUser: ConduitUser;
  articlesApi: ArticlesApi;
  anonArticlesApi: ArticlesApi;
  commentsApi: CommentsApi;
  anonCommentsApi: CommentsApi;
};

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

  articlesApi: async ({ conduitUser }, use) => {
    const context = await createConduitContext(conduitUser.token);
    try {
      const api = new ArticlesApi(context);

      await use(api);

      const { articles } = await api.list({
        author: conduitUser.username,
        limit: '100',
      });
      // Sequential deletes — shared demo backend cannot handle parallel teardown
      for (const article of articles) {
        try {
          await api.remove(article.slug);
        } catch (error) {
          console.warn(
            `Failed to clean up article "${article.slug}": ${error}`,
          );
        }
      }
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
});

export { expect } from '@playwright/test';
