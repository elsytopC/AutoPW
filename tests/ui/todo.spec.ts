import { faker } from '@faker-js/faker';
import { test, expect } from '@fixtures/ui.fixture';

test.describe('TodoMVC', { tag: ['@ui'] }, () => {
  test('add single todo', { tag: ['@smoke'] }, async ({ todoPage }) => {
    const title = faker.lorem.words(3);

    await test.step('Add a new todo', async () => {
      await todoPage.addTodo(title);
    });

    await test.step('Verify todo appears in the list', async () => {
      const items = await todoPage.getItemTexts();
      expect(items).toContain(title);
    });
  });

  test('add multiple todos', { tag: ['@smoke'] }, async ({ todoPage }) => {
    const first = faker.lorem.words(2);
    const second = faker.lorem.words(2);

    await test.step('Add two todos', async () => {
      await todoPage.addTodo(first);
      await todoPage.addTodo(second);
    });

    await test.step('Verify both todos are listed', async () => {
      const items = await todoPage.getItemTexts();
      expect(items).toHaveLength(2);
    });
  });

  test('complete a todo', { tag: ['@smoke'] }, async ({ todoPage }) => {
    const title = faker.lorem.words(2);

    await test.step('Add a todo', async () => {
      await todoPage.addTodo(title);
    });

    await test.step('Mark todo as completed', async () => {
      await todoPage.completeTodo(title);
    });

    await test.step('Verify active count is zero', async () => {
      expect(await todoPage.getActiveCount()).toBe(0);
    });
  });

  test(
    'active count decreases after completing',
    { tag: ['@regression'] },
    async ({ todoPage }) => {
      const taskA = faker.lorem.words(2);
      const taskB = faker.lorem.words(2);

      await test.step('Add two todos', async () => {
        await todoPage.addTodo(taskA);
        await todoPage.addTodo(taskB);
      });

      await test.step('Verify initial active count is 2', async () => {
        expect(await todoPage.getActiveCount()).toBe(2);
      });

      await test.step('Complete first todo', async () => {
        await todoPage.completeTodo(taskA);
      });

      await test.step('Verify active count decreased to 1', async () => {
        expect(await todoPage.getActiveCount()).toBe(1);
      });
    },
  );

  test(
    'filter active todos',
    { tag: ['@regression'] },
    async ({ todoPage }) => {
      const activeTitle = faker.lorem.words(2);
      const doneTitle = faker.lorem.words(2);

      await test.step('Add and complete one of two todos', async () => {
        await todoPage.addTodo(activeTitle);
        await todoPage.addTodo(doneTitle);
        await todoPage.completeTodo(doneTitle);
      });

      await test.step('Apply Active filter', async () => {
        await todoPage.filterBy('Active');
      });

      await test.step('Verify only active todo is visible', async () => {
        const items = await todoPage.getItemTexts();
        expect(items).toContain(activeTitle);
        expect(items).not.toContain(doneTitle);
      });
    },
  );

  test(
    'filter completed todos',
    { tag: ['@regression'] },
    async ({ todoPage }) => {
      const activeTitle = faker.lorem.words(2);
      const doneTitle = faker.lorem.words(2);

      await test.step('Add and complete one of two todos', async () => {
        await todoPage.addTodo(activeTitle);
        await todoPage.addTodo(doneTitle);
        await todoPage.completeTodo(doneTitle);
      });

      await test.step('Apply Completed filter', async () => {
        await todoPage.filterBy('Completed');
      });

      await test.step('Verify only completed todo is visible', async () => {
        const items = await todoPage.getItemTexts();
        expect(items).toContain(doneTitle);
        expect(items).not.toContain(activeTitle);
      });
    },
  );

  test(
    'clear completed todos',
    { tag: ['@regression'] },
    async ({ todoPage }) => {
      const keepTitle = faker.lorem.words(2);
      const removeTitle = faker.lorem.words(2);

      await test.step('Add one active and one completed todo', async () => {
        await todoPage.addTodo(keepTitle);
        await todoPage.addTodo(removeTitle);
        await todoPage.completeTodo(removeTitle);
      });

      await test.step('Clear completed todos', async () => {
        await todoPage.clearCompleted();
      });

      await test.step('Verify only active todo remains', async () => {
        const items = await todoPage.getItemTexts();
        expect(items).toContain(keepTitle);
        expect(items).not.toContain(removeTitle);
      });
    },
  );

  test(
    'todo state is consistent across views',
    { tag: ['@regression'] },
    async ({ todoPage }) => {
      const title = faker.lorem.words(2);

      await test.step('Add a todo', async () => {
        await todoPage.addTodo(title);
      });

      // Soft assertions collect every failure instead of stopping at the first,
      // giving a full picture of what is broken in a single run.
      await test.step('Verify todo visual state with soft assertions', async () => {
        await expect.soft(todoPage.items).toHaveCount(1);
        await expect.soft(todoPage.itemByText(title)).toBeVisible();
        await expect.soft(todoPage.counter).toHaveText('1 item left');
      });
    },
  );

  test(
    'app stays functional when third-party requests are blocked',
    { tag: ['@regression'] },
    async ({ page, todoPage }) => {
      // Network interception: abort non-essential third-party assets to keep
      // the app isolated from external flakiness (analytics, fonts, images).
      await test.step('Block third-party network requests', async () => {
        await page.route('**/*', (route) => {
          const url = route.request().url();
          const isThirdParty = !url.includes('demo.playwright.dev');
          return isThirdParty ? route.abort() : route.continue();
        });
      });

      const title = faker.lorem.words(2);

      await test.step('Add a todo with third-party requests blocked', async () => {
        await todoPage.addTodo(title);
      });

      await test.step('Verify the todo was added regardless', async () => {
        await expect(todoPage.itemByText(title)).toBeVisible();
      });
    },
  );
});
