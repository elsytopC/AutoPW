# Stub-servers (in-process HTTP)

Fake HTTP backends for contract tests — **not** Playwright specs.

| File | Class | Purpose |
|---|---|---|
| `base.stub-server.ts` | `BaseStubServer` | Lifecycle, random port, JSON body parsing, responses |
| `users-api.stub-server.ts` | `UsersApiStubServer` | Users API contract |
| `conduit-api.stub-server.ts` | `ConduitApiStubServer` | Conduit subset + IDOR 403 |

New stub-servers extend `BaseStubServer` and implement only `handle()` routing;
override `errorBody()` for a backend-specific error envelope and `reset()` to
clear in-memory state on `stop()`.

Specs: **`tests/contract/`** (project `contract`).  
Docs: **`docs/testing-layers.md`**.
