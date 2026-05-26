import { test as base } from '@playwright/test';
import { TodoPage } from '@pages/todo.page';

type AuthFixtures = {
  todoPage: TodoPage;
};

function createAuthTest(storageState: string) {
  return base.extend<AuthFixtures>({
    page: async ({ browser }, use) => {
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      await use(page);
      await context.close();
    },

    todoPage: async ({ page }, use) => {
      const todoPage = new TodoPage(page);
      await todoPage.goto();
      await use(todoPage);
    },
  });
}

export const adminAuth = createAuthTest('.playwright/auth/admin.json');
export const userAuth = createAuthTest('.playwright/auth/user.json');

export { expect } from '@playwright/test';
