import { test, expect } from '@fixtures/conduit-ui.fixture';
import { ConduitUserFactory } from '@factories/conduit.factory';
import { createConduitContext, ConduitAuthApi } from '@api/conduit';
import { clearConduitSession } from '@utils/auth/conduit.session';
import { qase } from 'playwright-qase-reporter';

test.describe('Conduit auth (UI)', { tag: ['@ui', '@conduit'] }, () => {
  test(
    qase(29, 'registers a new user and lands on the home feed'),
    { tag: ['@smoke'] },
    async ({ conduitRegister, conduitHome, page }) => {
      const userData = ConduitUserFactory.create();

      await test.step('open register page', () => conduitRegister.goto());
      await test.step('submit registration form', () =>
        conduitRegister.register(userData));

      await expect(page).toHaveURL('/');
      await expect(conduitHome.newArticleLink).toBeVisible();
      await expect(conduitHome.navUserLink(userData.username)).toBeVisible();
    },
  );

  test(
    qase(30, 'logs in with existing credentials'),
    { tag: ['@regression'] },
    async ({ conduitLogin, conduitHome, page }) => {
      const userData = ConduitUserFactory.create();

      // Seed the account via API (fast). We are testing the login *form*, not
      // registration — and we cannot "log out" in this demo, so we clear
      // localStorage to simulate a fresh browser session.
      await test.step('seed user via API', async () => {
        const ctx = await createConduitContext();
        await new ConduitAuthApi(ctx).register(userData);
        await ctx.dispose();
      });

      await page.goto('/');
      await clearConduitSession(page);
      await page.reload();
      await expect(conduitHome.signInLink).toBeVisible();
      await expect(conduitHome.newArticleLink).not.toBeVisible();

      await test.step('open login page', () => conduitLogin.goto());
      await test.step('submit login form', () =>
        conduitLogin.login(userData.email, userData.password));

      await expect(page).toHaveURL('/');
      await expect(conduitHome.newArticleLink).toBeVisible();
      await expect(conduitHome.navUserLink(userData.username)).toBeVisible();
    },
  );
});
