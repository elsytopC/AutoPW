import { Page } from '@playwright/test';
import { RegisterUserRequest } from '@api/conduit';
import { step } from '@utils/step';
import { ConduitBasePage } from './base-conduit.page';

export class ConduitRegisterPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  @step('Open register page')
  async goto(): Promise<void> {
    await this.navigate('/register');
  }

  @step('Register as "{0.username}"')
  async register(data: RegisterUserRequest): Promise<void> {
    await this.fill(this.page.getByPlaceholder('Username'), data.username);
    await this.fill(this.page.getByPlaceholder('Email'), data.email);
    await this.fill(this.page.getByPlaceholder('Password'), data.password);
    await this.page.getByRole('button', { name: 'Sign up' }).click();
  }
}
