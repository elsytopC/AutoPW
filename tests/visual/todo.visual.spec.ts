import { test, expect } from '@fixtures/ui.fixture';

/**
 * Visual baselines for the TodoMVC app. Screenshots target the `.todoapp`
 * container (not the full page) to avoid noise from the static footer links.
 * Baselines are platform-specific; regenerate with:
 *   npx playwright test --project=ui-visual --update-snapshots
 */
test.describe('TodoMVC visual baseline', { tag: ['@visual', '@ui'] }, () => {
  test('empty app matches baseline', async ({ todoPage, page }) => {
    await expect(todoPage.items).toHaveCount(0);
    await expect(page.locator('.todoapp')).toHaveScreenshot('todo-empty.png');
  });

  test('populated list matches baseline', async ({ todoPage, page }) => {
    await todoPage.addTodo('Write tests');
    await todoPage.addTodo('Review the pull request');
    await todoPage.completeTodo('Write tests');

    await expect(page.locator('.todoapp')).toHaveScreenshot(
      'todo-populated.png',
    );
  });
});
