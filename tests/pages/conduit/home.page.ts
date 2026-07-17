import { Page } from '@playwright/test';
import { ConduitBasePage } from './base-conduit.page';

/** `/` — global feed with article previews and tag sidebar. */
export class ConduitHomePage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/');
  }
}
