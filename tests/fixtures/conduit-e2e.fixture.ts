import { expect, mergeTests } from '@playwright/test';
import { test as conduitApiTest } from './conduit.fixture';
import { test as conduitUiTest } from './conduit-ui.fixture';

/**
 * Composes Conduit API and UI fixtures for cross-layer scenarios without
 * coupling the standalone API and UI fixture modules to each other.
 */
export const test = mergeTests(conduitApiTest, conduitUiTest);

export { expect };
