import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Shared bits of every Conduit screen: top navigation and auth indicators.
 * Subclasses (LoginPage, EditorPage, …) inherit these locators so specs can
 * assert auth state without duplicating selector details.
 */
export abstract class ConduitBasePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Link showing the signed-in username in the top-right nav. */
  navUserLink(username: string): Locator {
    return this.page.getByRole('link', { name: username });
  }

  get newArticleLink(): Locator {
    return this.page.getByRole('link', { name: 'New Article' });
  }

  get signInLink(): Locator {
    return this.page.getByRole('link', { name: 'Sign in' });
  }
}
