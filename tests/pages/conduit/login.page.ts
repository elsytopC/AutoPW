import { Page } from '@playwright/test';
import { ConduitBasePage } from './base-conduit.page';

/** `/login` — email + password form. */
export class ConduitLoginPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/login');
  }

  /**
   * Fills the form and submits. Playwright auto-waits for the Sign in button
   * to become enabled once both fields are filled (Angular reactive form).
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.getByPlaceholder('Email').fill(email);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}
