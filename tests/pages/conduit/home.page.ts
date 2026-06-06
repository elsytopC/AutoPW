import { Locator, Page } from '@playwright/test';
import { ConduitBasePage } from './base-conduit.page';

/** `/` — global feed with article previews and tag sidebar. */
export class ConduitHomePage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/');
  }

  /**
   * Each preview is a single link wrapping title + description + tags.
   * We locate it by the nested heading so the locator stays stable.
   */
  articlePreview(title: string): Locator {
    return this.page
      .getByRole('link')
      .filter({ has: this.page.getByRole('heading', { name: title }) });
  }
}
