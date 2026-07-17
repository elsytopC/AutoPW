import { test as base } from '@playwright/test';

import { ConduitHomePage } from '@pages/conduit/home.page';
import { ConduitLoginPage } from '@pages/conduit/login.page';
import { ConduitRegisterPage } from '@pages/conduit/register.page';
import { ConduitEditorPage } from '@pages/conduit/editor.page';
import { ConduitArticlePage } from '@pages/conduit/article.page';

/**
 * UI-only fixture: wires up pre-built Page Objects so specs stay readable.
 * Does NOT register a user — auth tests create their own account via the UI,
 * while API+UI tests import `@fixtures/conduit-api-ui.fixture` for combined setup.
 */
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
