# ADR 001: Stub-servers vs contract tests

**Status:** Accepted  
**Date:** 2026-07-19

## Context

The repo had two folders named `mocks/`:

- `mocks/` — in-process HTTP server **implementations**
- `tests/mocks/` — Playwright **specs** (project `mock`)

The word “mock” was overloaded (stub server, test layer, Playwright project,
filename suffix `.mock.spec.ts`), which made onboarding and legacy support harder.

## Decision

1. **Specs** move to `tests/contract/` with suffix `*.contract.spec.ts`.
2. Playwright project **`mock`** renames to **`contract`**.
3. Fixture **`mock.fixture.ts`** renames to **`contract.fixture.ts`**.
4. **Stub-server implementations** live in **`stub-servers/`** (Phase 2, 2026-07-19).
   Legacy `mocks/` folder is a redirect only.
5. Deprecated npm aliases: `test:mock` → `test:contract` (remove after one release cycle).
6. Deprecated class names: `MockApiServer` / `ConduitMockServer` → `UsersApiStubServer` /
   `ConduitApiStubServer` (re-exports remain).

Fixture keys (`mockServer`, `mockUsersApi`, `conduitMockServer`) unchanged in
Phase 1–2; rename planned for Phase 3.

## Consequences

- New contract specs go under `tests/contract/`, project `contract`.
- Do not create new `tests/mocks/` paths or `--project=mock`.
- Documentation entry point: `docs/testing-layers.md`.

## Mapping (old → new)

| Old | New |
|---|---|
| `tests/mocks/` | `tests/contract/` |
| `*.mock.spec.ts` | `*.contract.spec.ts` |
| `@fixtures/mock.fixture` | `@fixtures/contract.fixture` |
| `--project=mock` | `--project=contract` |
| `npm run test:mock` | `npm run test:contract` |
| `@mocks/*` | `@stub-servers/*` |
| `mocks/mockServer.ts` | `stub-servers/users-api.stub-server.ts` |
| `mocks/conduitMockServer.ts` | `stub-servers/conduit-api.stub-server.ts` |
| `MockApiServer` | `UsersApiStubServer` |
| `ConduitMockServer` | `ConduitApiStubServer` |
