# Stub-servers (in-process HTTP)

Fake HTTP backends for contract tests — **not** Playwright specs.

| File | Class | Purpose |
|---|---|---|
| `users-api.stub-server.ts` | `UsersApiStubServer` | Users API contract |
| `conduit-api.stub-server.ts` | `ConduitApiStubServer` | Conduit subset + IDOR 403 |

Specs: **`tests/contract/`** (project `contract`).  
Docs: **`docs/testing-layers.md`**.

Legacy class names `MockApiServer` / `ConduitMockServer` are deprecated re-exports.
