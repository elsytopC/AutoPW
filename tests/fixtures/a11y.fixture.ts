import AxeBuilder from '@axe-core/playwright';
import { test as todoUiTest } from '@fixtures/todo-ui.fixture';

type A11yFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = todoUiTest.extend<A11yFixtures>({
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
