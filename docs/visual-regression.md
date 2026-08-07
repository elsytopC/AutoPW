# Visual regression

Screenshot baseline tests for TodoMVC (`ui-visual` project).

> **Navigation:** [README — Visual Regression](../README.md#visual-regression) · [tags.md](./tags.md)

---

## Current state

Linux baselines are **bootstrapped** in the repo:

```text
tests/visual/todo.visual.spec.ts-snapshots/
  todo-empty-ui-visual-linux.png
  todo-populated-ui-visual-linux.png
  todo-empty-ui-visual-darwin.png      ← for macOS developers
  todo-populated-ui-visual-darwin.png
```

The `visual-ci` job runs on every push/PR once `*-linux.png` files exist.

---

## Run locally

```bash
npm run test:setup          # one-time Chromium install
npm run test:visual         # compare against OS-matched baseline
```

On **Windows**, skip locally — baselines exist for **darwin** and **linux** only.

---

## Reviewing a failure

When `toHaveScreenshot` fails, Playwright attaches a diff in the HTML report:

```bash
npx playwright show-report
```

In the report for a failed visual test you will see:

1. **Expected** — committed baseline (`*-linux.png` or `*-darwin.png`)
2. **Actual** — screenshot from the failing run
3. **Diff** — highlighted pixel differences (red = mismatch)

Typical causes: intentional UI change, font rendering drift on wrong OS, or
 flaky animation (this project disables animations in `playwright.config.ts`).

---

## Updating baselines

### On your OS (local)

```bash
npx playwright test --project=ui-visual --update-snapshots
```

This updates the baseline for **your** platform only (e.g. `-darwin.png` on macOS).

### For CI (Linux)

Use the **Update Visual Baselines** workflow
(`.github/workflows/visual-baselines.yml`) from the GitHub Actions tab. It runs
on `ubuntu-latest` — the same environment as `visual-ci` — and commits updated
`*-linux.png` files back to the branch.

Run this workflow:

- Once after clone if Linux baselines are missing
- After any **intentional** visual change to TodoMVC specs or `.todoapp` targeting

---

## Writing a new visual test

Reference: `tests/visual/todo.visual.spec.ts`

```typescript
import { test, expect } from '@fixtures/todo-ui.fixture';

test('my state matches baseline', async ({ todoPage, page }) => {
  // arrange UI state via todoPage …
  await expect(page.locator('.todoapp')).toHaveScreenshot('my-state.png');
});
```

Rules:

- Target a **stable container** (`.todoapp`), not full page
- Tag: `@visual` + `@ui` on the describe block
- Run `--update-snapshots` on Linux (via workflow) before expecting green CI
