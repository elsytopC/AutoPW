# Contract tests

Playwright project: **`contract`**

Real API clients (`UsersApi`, Conduit services) run against in-process
stub-servers from `stub-servers/`. No live network, no `API_BASE_URL`.

```bash
npm run test:contract
npm run test:smoke:contract
```

Fixture: `@fixtures/contract.fixture`  
Docs: `docs/testing-layers.md`
