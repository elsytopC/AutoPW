import { test as base } from '@playwright/test';
import * as allure from 'allure-js-commons';

// First match wins, so a test tagged both @regression and @security is a blocker.
const SEVERITY_BY_TAG: ReadonlyArray<[tag: string, severity: allure.Severity]> =
  [
    ['@security', allure.Severity.BLOCKER],
    ['@smoke', allure.Severity.CRITICAL],
    ['@regression', allure.Severity.NORMAL],
  ];

type BaseFixtures = {
  allureSeverity: void;
};

export const test = base.extend<BaseFixtures>({
  allureSeverity: [
    async ({}, use, testInfo) => {
      const match = SEVERITY_BY_TAG.find(([tag]) =>
        testInfo.tags.includes(tag),
      );
      if (match) {
        await allure.severity(match[1]);
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
