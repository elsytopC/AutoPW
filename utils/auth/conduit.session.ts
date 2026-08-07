import { Page } from '@playwright/test';
import { ConduitUser } from '@api/conduit';

/** Conduit SPA reads JWT from `localStorage.jwtToken` — not Playwright storageState. */

export async function authenticateConduitUser(
  page: Page,
  user: ConduitUser,
): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem('jwtToken', token);
  }, user.token);
}

export async function clearConduitSession(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.removeItem('jwtToken'));
}
