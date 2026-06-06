import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Shared bits of every Conduit screen: top navigation and auth indicators.
 * Subclasses (LoginPage, EditorPage, …) inherit these helpers so we do not
 * duplicate nav assertions in every page object.
 */
export abstract class ConduitBasePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Link showing the signed-in username in the top-right nav. */
  navUserLink(username: string): Locator {
    return this.page.getByRole('link', { name: username });
  }

  /** Asserts the SPA considers us logged in (New Article + username visible). */
  async expectLoggedInAs(username: string): Promise<void> {
    await expect(
      this.page.getByRole('link', { name: 'New Article' }),
    ).toBeVisible();
    await expect(this.navUserLink(username)).toBeVisible();
  }

  /** Asserts the anonymous state (Sign in / Sign up links, no New Article). */
  async expectLoggedOut(): Promise<void> {
    await expect(
      this.page.getByRole('link', { name: 'Sign in' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('link', { name: 'New Article' }),
    ).not.toBeVisible();
  }
}
