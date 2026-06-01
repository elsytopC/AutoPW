import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type A11yFixtures = {
  /**
   * Factory for a pre-configured axe scanner (WCAG 2.0/2.1 level A & AA).
   * Returning a builder lets each test refine the scan (include/exclude/rules)
   * before calling `.analyze()`.
   */
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<A11yFixtures>({
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
