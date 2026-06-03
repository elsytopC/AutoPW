import { test as base } from '@playwright/test';

import { createConduitContext } from '@api/conduit/client/conduitClient';
import { ConduitAuthApi } from '@api/conduit/services/auth.api';
import { ArticlesApi } from '@api/conduit/services/articles.api';
import { ConduitUser } from '@api/conduit/models/user.model';
import { ConduitUserFactory } from '@factories/conduit.factory';

type ConduitFixtures = {
  /** A throwaway user registered fresh for each test. */
  conduitUser: ConduitUser;
  /** Articles API authenticated as `conduitUser`. */
  articlesApi: ArticlesApi;
  /** Unauthenticated Articles API for negative auth checks. */
  anonArticlesApi: ArticlesApi;
};

export const test = base.extend<ConduitFixtures>({
  conduitUser: async ({}, use) => {
    const context = await createConduitContext();
    const auth = new ConduitAuthApi(context);
    const user = await auth.register(ConduitUserFactory.create());
    await context.dispose();

    await use(user);
  },

  articlesApi: async ({ conduitUser }, use) => {
    const context = await createConduitContext(conduitUser.token);
    const api = new ArticlesApi(context);

    await use(api);

    // The user is throwaway, so everything they authored was created by this
    // test. Delete it all to keep the shared backend clean.
    const { articles } = await api.list({
      author: conduitUser.username,
      limit: '100',
    });
    await Promise.all(
      articles.map((article) =>
        api.remove(article.slug).catch(() => undefined),
      ),
    );
    await context.dispose();
  },

  anonArticlesApi: async ({}, use) => {
    const context = await createConduitContext();

    await use(new ArticlesApi(context));

    await context.dispose();
  },
});

export { expect } from '@playwright/test';
