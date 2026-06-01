import dotenv from 'dotenv';

dotenv.config();

import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Shared config for every UI browser project: auth session + setup dependency.
 * Default session is admin; override per-test via adminAuth / userAuth fixtures.
 */
const uiProjectDefaults = {
  testMatch: ['**/tests/ui/**/*.spec.ts'],
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
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['list'],
        ['html'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['allure-playwright', { resultsDir: 'allure-results' }],
      ]
    : [
        ['list'],
        ['html'],
        ['allure-playwright', { resultsDir: 'allure-results' }],
      ],
  /* Visual comparison defaults: tolerate sub-pixel AA noise, freeze animations */
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: 'https://demo.playwright.dev',
  },

  /* Configure separate projects for API and UI layers */
  projects: [
    {
      name: 'setup-auth-admin',
      testMatch: ['**/tests/auth/admin.setup.ts'],
    },

    {
      // Real API tests — require a reachable backend and credentials.
      name: 'api',
      testMatch: ['**/tests/api/**/*.spec.ts'],
    },

    {
      // Contract tests against the in-process mock server — no network/secrets.
      name: 'mock',
      testMatch: ['**/tests/mocks/**/*.spec.ts'],
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
      // Visual regression — baselines are platform-specific, so this project is
      // kept out of the default CI run and triggered deliberately via dispatch.
      name: 'ui-visual',
      testMatch: ['**/tests/visual/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      // Accessibility (axe-core) — platform-independent, runs in regular CI.
      name: 'ui-a11y',
      testMatch: ['**/tests/a11y/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
