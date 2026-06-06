import { Page } from '@playwright/test';
import { ConduitUser } from '@api/conduit/models/user.model';

/**
 * Browser-session helpers for the RealWorld (Conduit) Angular SPA.
 *
 * Unlike `authManager` (which writes Playwright storageState files for the
 * Todo layer), Conduit reads its token from `localStorage.jwtToken` on boot.
 */

/** Injects the JWT before the first navigation so the SPA starts authenticated. */
export async function authenticateConduitUser(
  page: Page,
  user: ConduitUser,
): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem('jwtToken', token);
  }, user.token);
}

/** Clears the SPA session so the next navigation starts logged out. */
export async function clearConduitSession(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.removeItem('jwtToken'));
}
