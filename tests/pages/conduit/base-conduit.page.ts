import { expect, Locator, Page } from '@playwright/test';
import { env } from '@config/env';
import { BasePage } from '../base.page';

export abstract class ConduitBasePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  navUserLink(username: string): Locator {
    return this.page.getByRole('link', { name: username });
  }

  get newArticleLink(): Locator {
    return this.page.getByRole('link', { name: 'New Article' });
  }

  get signInLink(): Locator {
    return this.page.getByRole('link', { name: 'Sign in' });
  }

  /** Pathname check pinned to CONDUIT_UI_URL origin (avoids bare URL regex). */
  async expectPathname(pathPattern: RegExp): Promise<void> {
    const origin = new URL(env.conduitUiUrl).origin;
    await expect(this.page).toHaveURL((url) => {
      const parsed = new URL(url);
      return parsed.origin === origin && pathPattern.test(parsed.pathname);
    });
  }
}
