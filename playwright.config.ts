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
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
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
    ? [['list'], ['html'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html']],
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
      name: 'api',
      testMatch: ['**/tests/api/**/*.spec.ts', '**/tests/mocks/**/*.spec.ts'],
    },

    {
      name: 'ui-chromium',
      testMatch: ['**/tests/ui/**/*.spec.ts'],
      dependencies: ['setup-auth-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/auth/admin.json',
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
