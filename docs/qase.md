# Qase TestOps integration

Optional reporting to [Qase TestOps](https://qase.io/) via
[`playwright-qase-reporter`](https://github.com/qase-tms/qase-javascript/tree/main/qase-playwright).

> **Navigation:** [INDEX.md](./INDEX.md)

---

## Default behaviour

Reporting is **off** by default. Tests run normally; `qase(id, 'title')` wrappers
in specs are no-ops until you enable TestOps mode.

Configuration: `qase.config.json`

```json
{
  "mode": "off",
  "testops": {
    "project": "QA"
  }
}
```

The Playwright reporter is always listed in `playwright.config.ts` — it reads
`mode` from `qase.config.json` and `QASE_MODE` from the environment.

---

## Enable locally

1. Create a Qase project (this repo expects project code **`QA`** — change in
   `qase.config.json` if yours differs).
2. Generate an API token in Qase → Settings → API Tokens.
3. Add to `.env` locally (never commit the token):

```bash
QASE_MODE=testops
QASE_TESTOPS_API_TOKEN=your_token_here
```

4. Run tests as usual:

```bash
npm run test:smoke
```

Results upload to Qase TestOps with case IDs mapped from `qase(id, 'title')`.

---

## Mapping tests to Qase cases

Every spec uses the wrapper imported from `playwright-qase-reporter`:

```typescript
import { qase } from 'playwright-qase-reporter';

test(
  qase(37, 'article created via API is visible in the browser'),
  { tag: ['@smoke'] },
  async ({ … }) => { … },
);
```

| Argument | Meaning |
|---|---|
| `id` | Qase case ID (numeric) — must exist in your Qase project |
| `'title'` | Human-readable title shown in Playwright reports; synced to Qase when mode is on |

When adding a new test:

1. Create the case in Qase (or reuse an ID during PoC).
2. Wrap the test title with `qase(id, 'descriptive title')`.
3. Keep the title aligned with Qase case name for easier traceability.

---

## What appears in TestOps

When `QASE_MODE=testops`:

- Test run created per Playwright execution (`complete: true` in config)
- Pass/fail status per mapped case
- Attachments uploaded when enabled (`uploadAttachments: true`)
- Flaky retries marked when `framework.markAsFlaky: true`

Playwright `test.step` descriptions appear in standard HTML/Allure reports;
Qase receives case-level results from the reporter.

---

## CI

The `playwright-qase-reporter` is included in CI reporter lists, but **`QASE_MODE`
is not set in GitHub Actions** by default — CI runs do not upload to Qase unless
you add `QASE_TESTOPS_API_TOKEN` as a repository secret and set `QASE_MODE=testops`
in the workflow env.

Recommended approach:

| Environment | Qase |
|---|---|
| Local exploratory / TestOps validation | Enable via `.env` |
| CI (PR feedback) | Off — use JUnit + HTML + Allure artifacts |
| Nightly / release | Optional — add secret + env when TestOps tracking is required |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `qase` calls have no effect | Check `QASE_MODE=testops` in `.env` |
| Auth errors from reporter | Verify `QASE_TESTOPS_API_TOKEN` is valid and not expired |
| Case not found | Ensure case ID exists in project `QA` (or update `qase.config.json`) |
| Duplicate run noise | Use selective `--grep` locally; Qase creates one run per full execution |

---

## Security

- Store `QASE_TESTOPS_API_TOKEN` only in `.env` or CI secrets — **never** in code or chat.
- `.env` is gitignored; do not add the token to committed files.
