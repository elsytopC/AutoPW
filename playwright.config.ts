import dotenv from 'dotenv';

dotenv.config();

import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Shared config for Todo UI browser projects.
 *
 * `dependencies: ['setup-auth-admin']` bootstraps admin storageState before
 * ui-chromium/firefox/webkit run. TodoMVC specs do not require login — this
 * demonstrates the auth-bootstrap pattern for apps that do. Projects that
 * do not need it (ui-a11y, ui-visual, conduit-ui) omit this dependency.
 */
const uiProjectDefaults = {
  testMatch: ['**/tests/ui/**/*.spec.ts'],
  // Conduit UI tests live under tests/ui/conduit/** but target a different
  // baseURL — they run only in the dedicated `conduit-ui` project, so keep
  // them out of the default browser projects to avoid wrong-baseURL failures.
  testIgnore: ['**/tests/ui/conduit/**'],
  dependencies: ['setup-auth-admin'],
};

const uiStorageState = '.playwright/auth/admin.json';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Validate config / clean up generated artifacts around the whole run */
  globalSetup: './config/global-setup.ts',
  globalTeardown: './config/global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Local: 1 worker (stable against shared Conduit demo). CI: 2 workers. */
  workers: process.env.CI ? 2 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['list'],
        ['html'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['allure-playwright', { resultsDir: 'allure-results' }],
        // mode is read from qase.config.json; defaults to "off" unless
        // QASE_MODE=testops is set in the environment.
        ['playwright-qase-reporter'],
      ]
    : [
        ['list'],
        ['html'],
        ['allure-playwright', { resultsDir: 'allure-results' }],
        ['playwright-qase-reporter'],
      ],

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: 'https://demo.playwright.dev',
  },

  projects: [
    {
      name: 'setup-auth-admin',
      testMatch: ['**/tests/auth/admin.setup.ts'],
    },

    {
      // Real API tests — require a reachable backend and credentials.
      name: 'api',
      testMatch: ['**/tests/api/*.spec.ts'],
    },

    {
      name: 'conduit-api',
      testMatch: ['**/tests/api/conduit/**/*.spec.ts'],
      fullyParallel: false,
      retries: 2,
    },

    {
      name: 'contract',
      testMatch: ['**/tests/contract/**/*.spec.ts'],
    },

    {
      name: 'ui-chromium',
      ...uiProjectDefaults,
      use: {
        ...devices['Desktop Chrome'],
        storageState: uiStorageState,
      },
    },

    {
      name: 'ui-firefox',
      ...uiProjectDefaults,
      use: {
        ...devices['Desktop Firefox'],
        storageState: uiStorageState,
      },
    },

    {
      name: 'ui-webkit',
      ...uiProjectDefaults,
      use: {
        ...devices['Desktop Safari'],
        storageState: uiStorageState,
      },
    },

    {
      // Visual regression is isolated from regular UI projects and runs in its
      // dedicated CI job after Linux baseline availability has been verified.
      name: 'ui-visual',
      testMatch: ['**/tests/visual/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      // No setup-auth-admin — TodoMVC a11y scans are unauthenticated.
      name: 'ui-a11y',
      testMatch: ['**/tests/a11y/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'conduit-ui',
      testMatch: ['**/tests/ui/conduit/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.conduitUiUrl,
      },
      fullyParallel: false,
      retries: 2,
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
