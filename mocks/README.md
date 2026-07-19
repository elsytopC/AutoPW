# Stub-servers (in-process HTTP)

This folder holds **fake HTTP backends**, not Playwright tests.

| File | Purpose |
|---|---|
| `mockServer.ts` | Users API contract (`MockApiServer`) |
| `conduitMockServer.ts` | Conduit subset + IDOR 403 enforcement |

Specs that use these servers live in **`tests/contract/`** (Playwright project
`contract`). See `docs/testing-layers.md`.
