import { Page } from '@playwright/test';
import { ConduitBasePage } from './base-conduit.page';

export class ConduitLoginPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/login');
  }

  /**
   * Sign in button stays disabled until Angular reactive form validates both fields.
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.getByPlaceholder('Email').fill(email);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}
