import { test as base } from '@playwright/test';

import { createConduitContext } from '@api/conduit/client/conduitClient';
import { ConduitAuthApi } from '@api/conduit/services/auth.api';
import { ArticlesApi } from '@api/conduit/services/articles.api';
import { CommentsApi } from '@api/conduit/services/comments.api';
import { ConduitUser } from '@api/conduit/models/user.model';
import { ConduitUserFactory } from '@factories/conduit.factory';

type ConduitFixtures = {
  /** A throwaway user registered fresh for each test. */
  conduitUser: ConduitUser;
  /** Articles API authenticated as `conduitUser`. */
  articlesApi: ArticlesApi;
  /** Unauthenticated Articles API for negative auth checks. */
  anonArticlesApi: ArticlesApi;
  /** Comments API authenticated as `conduitUser`. */
  commentsApi: CommentsApi;
  /** Unauthenticated Comments API for negative auth checks. */
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

      // The user is throwaway, so everything they authored was created by
      // this test. Delete it all to keep the shared backend clean.
      const { articles } = await api.list({
        author: conduitUser.username,
        limit: '100',
      });
      // Sequential deletes — avoid hammering the shared demo backend with
      // parallel teardown when multiple spec files run concurrently.
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

  // Comments are deleted automatically when their parent article is removed,
  // and the articlesApi fixture already cleans up every article authored by
  // `conduitUser`, so no extra comment teardown is required here.
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
