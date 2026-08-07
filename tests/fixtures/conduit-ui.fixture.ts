import { test as base } from '@playwright/test';

import {
  ConduitHomePage,
  ConduitLoginPage,
  ConduitRegisterPage,
  ConduitEditorPage,
  ConduitArticlePage,
} from '@pages/conduit';

type ConduitUiFixtures = {
  conduitHome: ConduitHomePage;
  conduitLogin: ConduitLoginPage;
  conduitRegister: ConduitRegisterPage;
  conduitEditor: ConduitEditorPage;
  conduitArticle: ConduitArticlePage;
};

export const test = base.extend<ConduitUiFixtures>({
  conduitHome: async ({ page }, use) => {
    await use(new ConduitHomePage(page));
  },

  conduitLogin: async ({ page }, use) => {
    await use(new ConduitLoginPage(page));
  },

  conduitRegister: async ({ page }, use) => {
    await use(new ConduitRegisterPage(page));
  },

  conduitEditor: async ({ page }, use) => {
    await use(new ConduitEditorPage(page));
  },

  conduitArticle: async ({ page }, use) => {
    await use(new ConduitArticlePage(page));
  },
});

export { expect } from '@playwright/test';
