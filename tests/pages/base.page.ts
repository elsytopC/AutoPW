import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path = ''): Promise<void> {
    await this.page.goto(path);
  }

  async waitForVisible(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
