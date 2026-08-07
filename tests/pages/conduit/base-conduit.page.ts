import { Locator, Page } from '@playwright/test';
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
}
