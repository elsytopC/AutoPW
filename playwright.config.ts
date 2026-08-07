import dotenv from 'dotenv';

dotenv.config();

import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

/**
 * Todo UI browser projects depend on `setup-auth-admin` to demonstrate
 * storageState bootstrap. TodoMVC specs do not require login. Projects that
 * skip it: ui-a11y, ui-visual, conduit-ui.
 *
 * Conduit UI specs (`tests/ui/conduit/**`) use a separate `baseURL` and run
 * only in the `conduit-ui` project.
 */
const uiProjectDefaults = {
  testMatch: ['**/tests/ui/**/*.spec.ts'],
  testIgnore: ['**/tests/ui/conduit/**'],
  dependencies: ['setup-auth-admin'],
};

const uiStorageState = '.playwright/auth/admin.json';

export default defineConfig({
  testDir: './tests',
  globalSetup: './config/global-setup.ts',
  globalTeardown: './config/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1, // local: 1 worker — shared Conduit demo stability
  reporter: process.env.CI
    ? [
        ['list'],
        ['html'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['allure-playwright', { resultsDir: 'allure-results' }],
        ['playwright-qase-reporter'], // QASE_MODE=testops enables upload
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
      name: 'api',
      testMatch: ['**/tests/api/*.spec.ts'],
    },

    {
      name: 'conduit-api',
      testMatch: ['**/tests/api/conduit/**/*.spec.ts'],
      fullyParallel: false, // shared backend — avoid parallel teardown races
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
      name: 'ui-visual',
      testMatch: ['**/tests/visual/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
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
});
