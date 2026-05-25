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
    this.clearCompletedButton = page.getByRole('button', { name: 'Clear completed' });
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

  async deleteTodo(text: string): Promise<void> {
    const item = this.todoItems.filter({ hasText: text });
    await item.hover();
    await item.getByRole('button', { name: 'Delete' }).click();
  }

  async editTodo(oldText: string, newText: string): Promise<void> {
    await this.todoItems.filter({ hasText: oldText }).dblclick();
    const editInput = this.page.getByRole('textbox', { name: 'Edit' });
    await editInput.fill(newText);
    await editInput.press('Enter');
  }

  async filterBy(filter: TodoFilter): Promise<void> {
    await this.page.getByRole('link', { name: filter }).click();
  }

  async clearCompleted(): Promise<void> {
    await this.clearCompletedButton.click();
  }

  async getItems(): Promise<Locator> {
    return this.todoItems;
  }

  async getItemTexts(): Promise<string[]> {
    return this.todoItems.allInnerTexts();
  }

  async getActiveCount(): Promise<number> {
    const text = await this.todoCount.innerText();
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async isCompleted(text: string): Promise<boolean> {
    const item = this.todoItems.filter({ hasText: text });
    return item.locator('.completed').isVisible().catch(() => false);
  }
}
