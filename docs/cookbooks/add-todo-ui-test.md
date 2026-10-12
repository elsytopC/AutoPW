# Cookbook — add a Todo UI test

Step-by-step recipe for a new TodoMVC browser test.

**Reference spec:** `tests/ui/todo.spec.ts`  
**Estimated touch points:** 1 spec file (+ optional page method + factory helper)

---

## Prerequisites

- Browsers installed: `npm run test:setup`
- No `.env` or backend required — tests hit `demo.playwright.dev`

---

## Steps

### 1. Add a page method (if needed)

If the interaction is not already on `TodoPage`, add it in `tests/pages/todo.page.ts`.
Keep all locators inside the Page Object — never in the spec.

```typescript
// tests/pages/todo.page.ts
@step('Remove todo "{0}"')
async removeTodo(text: string): Promise<void> {
  await this.todoItems
    .filter({ hasText: text })
    .getByRole('button', { name: 'Delete' })
    .click();
}
```

Mark every action method with `@step` (`import { step } from '@utils/step'`) —
the call becomes a named report step. Type text with `this.fill(locator, value)`,
never `locator.fill()` directly: lint enforces it.

Skip this step if existing methods (`addTodo`, `completeTodo`, `filterBy`, …) are enough.

### 2. Add test data via factory

Use `TodoFactory` from `factories/todo.factory.ts`. Never call Faker directly in specs.

```typescript
import { TodoFactory } from '@factories/todo.factory';

const title = TodoFactory.createTitle();
```

### 3. Write the spec

Create or extend `tests/ui/todo.spec.ts`:

```typescript
import { TodoFactory } from '@factories/todo.factory';
import { test, expect } from '@fixtures/todo-ui.fixture';
import { qase } from 'playwright-qase-reporter';

test.describe('TodoMVC', { tag: ['@ui'] }, () => {
  test(
    qase(99, 'removes a todo'),
    { tag: ['@regression'] },
    async ({ todoPage }) => {
      const title = TodoFactory.createTitle();

      await todoPage.addTodo(title);
      await todoPage.removeTodo(title);

      await test.step('Verify list is empty', async () => {
        await expect(todoPage.items, 'todo list is empty').toHaveCount(0);
      });
    },
  );
});
```

**Rules:**

- Import `test`/`expect` from `@fixtures/todo-ui.fixture` (not `@playwright/test`)
- Page-object calls are already steps (`@step`) — don't wrap a single call in `test.step`
- Use `test.step('English description', …)` to group several calls and for checks
- Tag every test: `@smoke` or `@regression` + `@ui`
- Wrap title in `qase(id, 'title')` when Qase is enabled

### 4. Run and verify

```bash
npx playwright test tests/ui/todo.spec.ts -g "removes a todo" --project=ui-chromium
npm run lint
```

---

## Checklist

- [ ] Locators only in `tests/pages/todo.page.ts`
- [ ] Test data via `TodoFactory`, not inline Faker
- [ ] Fixture import from `@fixtures/todo-ui.fixture`
- [ ] New page-object actions have `@step`; specs use `test.step` for groups and checks; every `expect` has a message
- [ ] `annotation: behavior('TodoMVC', '<Feature>')` on `test.describe`
- [ ] Tags: `@ui` + `@smoke` or `@regression`
- [ ] Targeted run passes
