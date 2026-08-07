import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TodoPage } from '@pages/todo.page';

type A11yFixtures = {
  /** Pre-navigated TodoMVC page — same pattern as `todo-ui.fixture.ts`. */
  todoPage: TodoPage;
  /**
   * Factory for a pre-configured axe scanner (WCAG 2.0/2.1 level A & AA).
   * Returning a builder lets each test refine the scan (include/exclude/rules)
   * before calling `.analyze()`.
   */
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
