import { test, expect } from '@fixtures/todo-ui.fixture';
import { qase } from 'playwright-qase-reporter';

test.describe('TodoMVC visual baseline', { tag: ['@visual', '@ui'] }, () => {
  test(qase(10, 'empty app matches baseline'), async ({ todoPage, page }) => {
    await expect(todoPage.items).toHaveCount(0);
    await expect(page.locator('.todoapp')).toHaveScreenshot('todo-empty.png');
  });

  test(
    qase(11, 'populated list matches baseline'),
    async ({ todoPage, page }) => {
      await todoPage.addTodo('Write tests');
      await todoPage.addTodo('Review the pull request');
      await todoPage.completeTodo('Write tests');

      await expect(page.locator('.todoapp')).toHaveScreenshot(
        'todo-populated.png',
      );
    },
  );
});
