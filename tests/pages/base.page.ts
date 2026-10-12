import { Locator, Page } from '@playwright/test';
import { assertNotRealCredential } from '@utils/auth/ui-credentials-guard';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path = ''): Promise<void> {
    await this.page.goto(path);
  }

  protected async fill(locator: Locator, value: string): Promise<void> {
    assertNotRealCredential(value);
    await locator.fill(value);
  }
}
