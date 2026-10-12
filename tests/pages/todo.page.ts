import { Page, Locator } from '@playwright/test';
import { step } from '@utils/step';
import { BasePage } from './base.page';

export type TodoFilter = 'All' | 'Active' | 'Completed';

export class TodoPage extends BasePage {
  private readonly input: Locator;
  private readonly todoItems: Locator;
  private readonly todoCount: Locator;
  private readonly clearCompletedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.input = page.getByPlaceholder('What needs to be done?');
    this.todoItems = page.getByTestId('todo-item');
    this.todoCount = page.getByTestId('todo-count');
    this.clearCompletedButton = page.getByRole('button', {
      name: 'Clear completed',
    });
  }

  @step('Open TodoMVC')
  async goto(): Promise<void> {
    await this.navigate('/todomvc');
  }

  @step('Add todo "{0}"')
  async addTodo(text: string): Promise<void> {
    await this.fill(this.input, text);
    await this.input.press('Enter');
  }

  @step('Complete todo "{0}"')
  async completeTodo(text: string): Promise<void> {
    await this.todoItems
      .filter({ hasText: text })
      .getByRole('checkbox')
      .check();
  }

  @step('Apply "{0}" filter')
  async filterBy(filter: TodoFilter): Promise<void> {
    await this.page.getByRole('link', { name: filter }).click();
  }

  @step('Clear completed todos')
  async clearCompleted(): Promise<void> {
    await this.clearCompletedButton.click();
  }

  get items(): Locator {
    return this.todoItems;
  }

  get counter(): Locator {
    return this.todoCount;
  }

  // The demo's root <section> has no test id or accessible name, so no role to target.
  get app(): Locator {
    return this.page.locator('.todoapp');
  }

  itemByText(text: string): Locator {
    return this.todoItems.filter({ hasText: text });
  }
}
