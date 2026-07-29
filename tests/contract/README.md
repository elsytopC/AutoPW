# Contract tests

Playwright project: **`contract`**

Real API clients (`UsersApi`, Conduit services) run against in-process
stub-servers from `stub-servers/`. No live network, no `API_BASE_URL`.

**After clone:** start with the repo [First run](../../README.md#first-run-2-minutes) guide — `test:contract` is the fastest sanity check (Node only, no browsers).

```bash
npm run test:contract
npm run test:smoke:contract
```

Fixture: `@fixtures/contract.fixture`  
Docs: `docs/testing-layers.md`, [README — First run](../../README.md#first-run-2-minutes)
