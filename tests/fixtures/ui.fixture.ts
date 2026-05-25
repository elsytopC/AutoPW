import { test as base } from '@playwright/test';
import { TodoPage } from '../pages/todo.page';

type UiFixtures = {
  todoPage: TodoPage;
};

export const test = base.extend<UiFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
  },
});

export { expect } from '@playwright/test';
