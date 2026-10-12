import { Page } from '@playwright/test';
import { step } from '@utils/step';
import { ConduitBasePage } from './base-conduit.page';

export class ConduitLoginPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  @step('Open login page')
  async goto(): Promise<void> {
    await this.navigate('/login');
  }

  /**
   * Sign in button stays disabled until Angular reactive form validates both fields.
   */
  @step('Log in as "{0}"')
  async login(email: string, password: string): Promise<void> {
    await this.fill(this.page.getByPlaceholder('Email'), email);
    await this.fill(this.page.getByPlaceholder('Password'), password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}
