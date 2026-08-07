import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TodoPage } from '@pages/todo.page';

type A11yFixtures = {
  todoPage: TodoPage;
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<A11yFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
  },

  makeAxeBuilder: async ({ page }, use) => {
    const make = () =>
      new AxeBuilder({ page }).withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
      ]);
    await use(make);
  },
});

export { expect } from '@playwright/test';
