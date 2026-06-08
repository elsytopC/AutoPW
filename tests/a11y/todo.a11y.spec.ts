import type { TestInfo } from '@playwright/test';
import { test, expect } from '@fixtures/a11y.fixture';
import { TodoPage } from '@pages/todo.page';
import { qase } from 'playwright-qase-reporter';

/**
 * Accessibility checks via axe-core. Unlike visual baselines, axe results are
 * platform-independent, so these run in regular CI. On failure the full axe
 * report is attached to the Playwright HTML report for triage.
 *
 * `color-contrast` is a known issue in the third-party TodoMVC demo (low-
 * contrast footer/counter text), not our code. We disable just that rule so
 * the scan still guards against every *other* regression.
 */
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
    async ({ page, makeAxeBuilder }, testInfo) => {
      const todo = new TodoPage(page);
      await todo.goto();

      const results = await makeAxeBuilder()
        .disableRules(KNOWN_DEMO_VIOLATIONS)
        .analyze();
      await attach(testInfo, results.violations);

      expect(results.violations).toEqual([]);
    },
  );

  test(
    qase(13, 'populated list has no detectable a11y violations'),
    async ({ page, makeAxeBuilder }, testInfo) => {
      const todo = new TodoPage(page);
      await todo.goto();
      await todo.addTodo('Write tests');
      await todo.completeTodo('Write tests');

      const results = await makeAxeBuilder()
        .disableRules(KNOWN_DEMO_VIOLATIONS)
        .analyze();
      await attach(testInfo, results.violations);

      expect(results.violations).toEqual([]);
    },
  );
});
