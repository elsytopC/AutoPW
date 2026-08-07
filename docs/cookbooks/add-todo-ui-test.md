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
async removeTodo(text: string): Promise<void> {
  await this.todoItems
    .filter({ hasText: text })
    .getByRole('button', { name: 'Delete' })
    .click();
}
```

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

      await test.step('Add a todo', async () => {
        await todoPage.addTodo(title);
      });

      await test.step('Remove the todo', async () => {
        await todoPage.removeTodo(title);
      });

      await test.step('Verify list is empty', async () => {
        expect(await todoPage.getItemTexts()).toHaveLength(0);
      });
    },
  );
});
```

**Rules:**

- Import `test`/`expect` from `@fixtures/todo-ui.fixture` (not `@playwright/test`)
- Wrap key actions in `test.step('English description', …)` for HTML reports
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
- [ ] `test.step` on each key action
- [ ] Tags: `@ui` + `@smoke` or `@regression`
- [ ] Targeted run passes
