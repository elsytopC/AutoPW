import { Page, Locator } from '@playwright/test';
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
    this.todoCount = page.locator('.todo-count');
    this.clearCompletedButton = page.getByRole('button', {
      name: 'Clear completed',
    });
  }

  async goto(): Promise<void> {
    await this.navigate('/todomvc');
  }

  async addTodo(text: string): Promise<void> {
    await this.input.fill(text);
    await this.input.press('Enter');
  }

  async completeTodo(text: string): Promise<void> {
    await this.todoItems
      .filter({ hasText: text })
      .getByRole('checkbox')
      .check();
  }

  async filterBy(filter: TodoFilter): Promise<void> {
    await this.page.getByRole('link', { name: filter }).click();
  }

  async clearCompleted(): Promise<void> {
    await this.clearCompletedButton.click();
  }

  get items(): Locator {
    return this.todoItems;
  }

  get counter(): Locator {
    return this.todoCount;
  }

  itemByText(text: string): Locator {
    return this.todoItems.filter({ hasText: text });
  }

  async getItemTexts(): Promise<string[]> {
    return this.todoItems.allInnerTexts();
  }

  async getActiveCount(): Promise<number> {
    const text = await this.todoCount.innerText();
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
