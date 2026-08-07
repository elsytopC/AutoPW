import { Page } from '@playwright/test';
import { RegisterUserRequest } from '@api/conduit';
import { ConduitBasePage } from './base-conduit.page';

/** `/register` — username + email + password form. */
export class ConduitRegisterPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/register');
  }

  /** Submits the registration form; on success the app redirects to home. */
  async register(data: RegisterUserRequest): Promise<void> {
    await this.page.getByPlaceholder('Username').fill(data.username);
    await this.page.getByPlaceholder('Email').fill(data.email);
    await this.page.getByPlaceholder('Password').fill(data.password);
    await this.page.getByRole('button', { name: 'Sign up' }).click();
  }
}
