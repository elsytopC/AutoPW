import { test, expect } from '@fixtures/conduit-ui.fixture';
import { ConduitUserFactory } from '@factories/conduit.factory';
import { behavior } from '@utils/allure';
import { clearConduitSession } from '@utils/auth/conduit.session';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'Conduit auth (UI)',
  {
    tag: ['@ui', '@conduit'],
    annotation: behavior('Conduit', 'Authentication'),
  },
  () => {
    test(
      qase(29, 'registers a new user and lands on the home feed'),
      { tag: ['@smoke'] },
      async ({ conduitRegister, conduitHome, page }) => {
        const userData = ConduitUserFactory.create();

        await conduitRegister.goto();
        await conduitRegister.register(userData);

        await test.step('Verify signed-in home feed', async () => {
          await expect(page, 'redirected to home feed').toHaveURL('/');
          await expect(
            conduitHome.newArticleLink,
            'New Article link is shown',
          ).toBeVisible();
          await expect(
            conduitHome.navUserLink(userData.username),
            'username is shown in the navbar',
          ).toBeVisible();
        });
      },
    );

    test(
      qase(30, 'logs in with existing credentials'),
      { tag: ['@regression'] },
      async ({ conduitLogin, conduitHome, anonAuthApi, page }) => {
        const userData = ConduitUserFactory.create();

        await test.step('Seed user via API', () =>
          anonAuthApi.register(userData));

        // Demo has no logout — clear localStorage to test the login form in isolation
        await test.step('Start from a signed-out session', async () => {
          await page.goto('/');
          await clearConduitSession(page);
          await page.reload();
          await expect(
            conduitHome.signInLink,
            'Sign in link is shown',
          ).toBeVisible();
          await expect(
            conduitHome.newArticleLink,
            'New Article link is hidden',
          ).not.toBeVisible();
        });

        await conduitLogin.goto();
        await conduitLogin.login(userData.email, userData.password);

        await test.step('Verify signed-in home feed', async () => {
          await expect(page, 'redirected to home feed').toHaveURL('/');
          await expect(
            conduitHome.newArticleLink,
            'New Article link is shown',
          ).toBeVisible();
          await expect(
            conduitHome.navUserLink(userData.username),
            'username is shown in the navbar',
          ).toBeVisible();
        });
      },
    );

    test(
      qase(51, 'shows an error for a wrong password'),
      { tag: ['@smoke'] },
      async ({ conduitLogin, anonAuthApi, page }) => {
        const registeredUser = ConduitUserFactory.create();
        const wrongPassword = ConduitUserFactory.create().password;

        await test.step('Seed user via API', () =>
          anonAuthApi.register(registeredUser));

        await conduitLogin.goto();
        await conduitLogin.login(registeredUser.email, wrongPassword);

        await test.step('Verify login is rejected', async () => {
          await expect(page, 'stays on the login page').toHaveURL(/\/login$/);
          await expect(
            conduitLogin.invalidCredentialsMessage,
            'invalid credentials message is shown',
          ).toBeVisible();
        });
      },
    );

    test(
      qase(52, 'sends a signed-out user away from the editor'),
      { tag: ['@smoke'] },
      async ({ conduitEditor, page }) => {
        await conduitEditor.goto();

        await test.step('Verify the editor redirects to login', async () => {
          await expect(page, 'redirected to login').toHaveURL(/\/login$/);
        });
      },
    );
  },
);
