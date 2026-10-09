import type { TestInfo } from '@playwright/test';
import { test, expect } from '@fixtures/a11y.fixture';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

// Known third-party TodoMVC demo issue — disable so other WCAG rules still run
const KNOWN_DEMO_VIOLATIONS = ['color-contrast'];

async function attach(testInfo: TestInfo, violations: unknown): Promise<void> {
  await testInfo.attach('axe-results', {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });
}

test.describe(
  'TodoMVC accessibility',
  {
    tag: ['@a11y', '@ui'],
    annotation: behavior('TodoMVC', 'Accessibility'),
  },
  () => {
    test(
      qase(12, 'empty app has no detectable a11y violations'),
      { tag: ['@smoke'] },
      async ({ todoPage, makeAxeBuilder }, testInfo) => {
        await test.step('Verify list is empty', async () => {
          await expect(todoPage.items, 'todo list is empty').toHaveCount(0);
        });

        const results = await test.step('Run axe WCAG scan', () =>
          makeAxeBuilder().disableRules(KNOWN_DEMO_VIOLATIONS).analyze());
        await attach(testInfo, results.violations);

        await test.step('Verify no violations', () => {
          expect(results.violations, 'axe violations').toEqual([]);
        });
      },
    );

    test(
      qase(13, 'populated list has no detectable a11y violations'),
      { tag: ['@regression'] },
      async ({ todoPage, makeAxeBuilder }, testInfo) => {
        await test.step('Add and complete a todo', async () => {
          await todoPage.addTodo('Write tests');
          await todoPage.completeTodo('Write tests');
        });

        const results = await test.step('Run axe WCAG scan', () =>
          makeAxeBuilder().disableRules(KNOWN_DEMO_VIOLATIONS).analyze());
        await attach(testInfo, results.violations);

        await test.step('Verify no violations', () => {
          expect(results.violations, 'axe violations').toEqual([]);
        });
      },
    );
  },
);
