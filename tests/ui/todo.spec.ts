import { TodoFactory } from '@factories/todo.factory';
import { test, expect } from '@fixtures/todo-ui.fixture';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'TodoMVC',
  { tag: ['@ui'], annotation: behavior('TodoMVC', 'Todo list') },
  () => {
    test(
      qase(1, 'add single todo'),
      { tag: ['@smoke'] },
      async ({ todoPage }) => {
        const title = TodoFactory.createTitle(3);

        await todoPage.addTodo(title);

        await test.step('Verify todo appears in the list', async () => {
          await expect(todoPage.items, 'list contains the new todo').toHaveText(
            [title],
          );
        });
      },
    );

    test(
      qase(2, 'add multiple todos'),
      { tag: ['@smoke'] },
      async ({ todoPage }) => {
        const first = TodoFactory.createTitle();
        const second = TodoFactory.createTitle();

        await test.step('Add two todos', async () => {
          await todoPage.addTodo(first);
          await todoPage.addTodo(second);
        });

        await test.step('Verify both todos are listed', async () => {
          await expect(todoPage.items, 'both todos are listed').toHaveText([
            first,
            second,
          ]);
        });
      },
    );

    test(
      qase(3, 'complete a todo'),
      { tag: ['@smoke'] },
      async ({ todoPage }) => {
        const title = TodoFactory.createTitle();

        await todoPage.addTodo(title);
        await todoPage.completeTodo(title);

        await test.step('Verify active count is zero', async () => {
          await expect(todoPage.counter, 'items left counter').toHaveText(
            '0 items left',
          );
        });
      },
    );

    test(
      qase(4, 'active count decreases after completing'),
      { tag: ['@regression'] },
      async ({ todoPage }) => {
        const taskA = TodoFactory.createTitle();
        const taskB = TodoFactory.createTitle();

        await test.step('Add two todos', async () => {
          await todoPage.addTodo(taskA);
          await todoPage.addTodo(taskB);
        });

        await test.step('Verify initial active count is 2', async () => {
          await expect(todoPage.counter, 'items left counter').toHaveText(
            '2 items left',
          );
        });

        await todoPage.completeTodo(taskA);

        await test.step('Verify active count decreased to 1', async () => {
          await expect(todoPage.counter, 'items left counter').toHaveText(
            '1 item left',
          );
        });
      },
    );

    test(
      qase(5, 'filter active todos'),
      { tag: ['@regression'] },
      async ({ todoPage }) => {
        const activeTitle = TodoFactory.createTitle();
        const doneTitle = TodoFactory.createTitle();

        await test.step('Add and complete one of two todos', async () => {
          await todoPage.addTodo(activeTitle);
          await todoPage.addTodo(doneTitle);
          await todoPage.completeTodo(doneTitle);
        });

        await todoPage.filterBy('Active');

        await test.step('Verify only active todo is visible', async () => {
          await expect(todoPage.items, 'only active todo is shown').toHaveText([
            activeTitle,
          ]);
        });
      },
    );

    test(
      qase(6, 'filter completed todos'),
      { tag: ['@regression'] },
      async ({ todoPage }) => {
        const activeTitle = TodoFactory.createTitle();
        const doneTitle = TodoFactory.createTitle();

        await test.step('Add and complete one of two todos', async () => {
          await todoPage.addTodo(activeTitle);
          await todoPage.addTodo(doneTitle);
          await todoPage.completeTodo(doneTitle);
        });

        await todoPage.filterBy('Completed');

        await test.step('Verify only completed todo is visible', async () => {
          await expect(
            todoPage.items,
            'only completed todo is shown',
          ).toHaveText([doneTitle]);
        });
      },
    );

    test(
      qase(7, 'clear completed todos'),
      { tag: ['@regression'] },
      async ({ todoPage }) => {
        const keepTitle = TodoFactory.createTitle();
        const removeTitle = TodoFactory.createTitle();

        await test.step('Add one active and one completed todo', async () => {
          await todoPage.addTodo(keepTitle);
          await todoPage.addTodo(removeTitle);
          await todoPage.completeTodo(removeTitle);
        });

        await todoPage.clearCompleted();

        await test.step('Verify only active todo remains', async () => {
          await expect(todoPage.items, 'only active todo remains').toHaveText([
            keepTitle,
          ]);
        });
      },
    );

    test(
      qase(8, 'todo state is consistent across views'),
      { tag: ['@regression'] },
      async ({ todoPage }) => {
        const title = TodoFactory.createTitle();

        await todoPage.addTodo(title);

        await test.step('Verify todo visual state with soft assertions', async () => {
          await expect.soft(todoPage.items, 'todos count').toHaveCount(1);
          await expect
            .soft(todoPage.itemByText(title), 'todo is shown')
            .toBeVisible();
          await expect
            .soft(todoPage.counter, 'items left counter')
            .toHaveText('1 item left');
        });
      },
    );

    test(
      qase(9, 'app stays functional when third-party requests are blocked'),
      { tag: ['@regression'] },
      async ({ page, todoPage }) => {
        await test.step('Block third-party network requests', async () => {
          await page.route('**/*', (route) => {
            const url = route.request().url();
            const isThirdParty = !url.includes('demo.playwright.dev');
            return isThirdParty ? route.abort() : route.continue();
          });
        });

        const title = TodoFactory.createTitle();

        await todoPage.addTodo(title);

        await test.step('Verify the todo was added regardless', async () => {
          await expect(
            todoPage.itemByText(title),
            'todo is shown',
          ).toBeVisible();
        });
      },
    );
  },
);
