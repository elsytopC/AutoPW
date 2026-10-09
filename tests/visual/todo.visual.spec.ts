import { test, expect } from '@fixtures/todo-ui.fixture';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'TodoMVC visual baseline',
  {
    tag: ['@visual', '@ui'],
    annotation: behavior('TodoMVC', 'Visual regression'),
  },
  () => {
    test(
      qase(10, 'empty app matches baseline'),
      { tag: ['@regression'] },
      async ({ todoPage, page }) => {
        await test.step('Verify list is empty', async () => {
          await expect(todoPage.items, 'todo list is empty').toHaveCount(0);
        });

        await test.step('Compare app with empty baseline', async () => {
          await expect(
            page.locator('.todoapp'),
            'app matches empty baseline',
          ).toHaveScreenshot('todo-empty.png');
        });
      },
    );

    test(
      qase(11, 'populated list matches baseline'),
      { tag: ['@regression'] },
      async ({ todoPage, page }) => {
        await test.step('Add two todos and complete one', async () => {
          await todoPage.addTodo('Write tests');
          await todoPage.addTodo('Review the pull request');
          await todoPage.completeTodo('Write tests');
        });

        await test.step('Compare app with populated baseline', async () => {
          await expect(
            page.locator('.todoapp'),
            'app matches populated baseline',
          ).toHaveScreenshot('todo-populated.png');
        });
      },
    );
  },
);
