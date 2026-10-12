import { Page } from '@playwright/test';
import { step } from '@utils/step';
import { ConduitBasePage } from './base-conduit.page';

export class ConduitHomePage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  @step('Open home feed')
  async goto(): Promise<void> {
    await this.navigate('/');
  }
}
