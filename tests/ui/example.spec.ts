import { test, expect } from '@playwright/test';

test('has title', { tag: ['@smoke', '@ui'] }, async ({ page }) => {
  await page.goto('https://playwright.dev/');

  await expect(page).toHaveTitle(/Playwright/);
});

test('homepage loads', { tag: ['@smoke', '@ui'] }, async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});

test('get started link', { tag: ['@regression', '@ui'] }, async ({ page }) => {
  await page.goto('https://playwright.dev/');

  await page.getByRole('link', { name: 'Get started' }).click();

  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
