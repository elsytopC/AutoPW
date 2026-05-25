import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/todo.page';

test.describe('TodoMVC', { tag: ['@ui'] }, () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('add single todo', { tag: ['@smoke'] }, async () => {
    await todoPage.addTodo('Buy groceries');

    const items = await todoPage.getItemTexts();

    expect(items).toContain('Buy groceries');
  });

  test('add multiple todos', { tag: ['@smoke'] }, async () => {
    await todoPage.addTodo('First task');
    await todoPage.addTodo('Second task');

    const items = await todoPage.getItemTexts();

    expect(items).toHaveLength(2);
  });

  test('complete a todo', { tag: ['@smoke'] }, async () => {
    await todoPage.addTodo('Write tests');
    await todoPage.completeTodo('Write tests');

    const count = await todoPage.getActiveCount();

    expect(count).toBe(0);
  });

  test('active count decreases after completing', { tag: ['@regression'] }, async () => {
    await todoPage.addTodo('Task A');
    await todoPage.addTodo('Task B');

    expect(await todoPage.getActiveCount()).toBe(2);

    await todoPage.completeTodo('Task A');

    expect(await todoPage.getActiveCount()).toBe(1);
  });

  test('filter active todos', { tag: ['@regression'] }, async () => {
    await todoPage.addTodo('Active task');
    await todoPage.addTodo('Done task');
    await todoPage.completeTodo('Done task');

    await todoPage.filterBy('Active');

    const items = await todoPage.getItemTexts();

    expect(items).toContain('Active task');
    expect(items).not.toContain('Done task');
  });

  test('filter completed todos', { tag: ['@regression'] }, async () => {
    await todoPage.addTodo('Active task');
    await todoPage.addTodo('Done task');
    await todoPage.completeTodo('Done task');

    await todoPage.filterBy('Completed');

    const items = await todoPage.getItemTexts();

    expect(items).toContain('Done task');
    expect(items).not.toContain('Active task');
  });

  test('clear completed todos', { tag: ['@regression'] }, async () => {
    await todoPage.addTodo('Keep me');
    await todoPage.addTodo('Remove me');
    await todoPage.completeTodo('Remove me');

    await todoPage.clearCompleted();

    const items = await todoPage.getItemTexts();

    expect(items).toContain('Keep me');
    expect(items).not.toContain('Remove me');
  });
});
