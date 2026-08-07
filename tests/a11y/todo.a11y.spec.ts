import type { TestInfo } from '@playwright/test';
import { test, expect } from '@fixtures/a11y.fixture';
import { qase } from 'playwright-qase-reporter';

// Known third-party TodoMVC demo issue — disable so other WCAG rules still run
const KNOWN_DEMO_VIOLATIONS = ['color-contrast'];

async function attach(testInfo: TestInfo, violations: unknown): Promise<void> {
  await testInfo.attach('axe-results', {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });
}

test.describe('TodoMVC accessibility', { tag: ['@a11y', '@ui'] }, () => {
  test(
    qase(12, 'empty app has no detectable a11y violations'),
    { tag: ['@smoke'] },
    async ({ todoPage, makeAxeBuilder }, testInfo) => {
      await expect(todoPage.items).toHaveCount(0);

      const results = await makeAxeBuilder()
        .disableRules(KNOWN_DEMO_VIOLATIONS)
        .analyze();
      await attach(testInfo, results.violations);

      expect(results.violations).toEqual([]);
    },
  );

  test(
    qase(13, 'populated list has no detectable a11y violations'),
    async ({ todoPage, makeAxeBuilder }, testInfo) => {
      await todoPage.addTodo('Write tests');
      await todoPage.completeTodo('Write tests');

      const results = await makeAxeBuilder()
        .disableRules(KNOWN_DEMO_VIOLATIONS)
        .analyze();
      await attach(testInfo, results.violations);

      expect(results.violations).toEqual([]);
    },
  );
});
