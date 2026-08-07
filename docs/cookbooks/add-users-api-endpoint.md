# Cookbook — add a Users API endpoint

Step-by-step recipe for a new Users API method with stub-server, contract, and live coverage.

**Reference specs:** `tests/contract/users.contract.spec.ts`, `tests/api/users.spec.ts`  
**Estimated touch points:** model → service → stub handler → contract spec → live spec

---

## Prerequisites

- Contract tests run without backend: `npm run test:contract`
- Live API tests need `API_BASE_URL` + credentials in `.env`

---

## Steps

### 1. Extend the Zod model (if response shape changes)

`api/models/user.model.ts` — add or update schemas for the new payload.

### 2. Add the service method

`api/services/users.api.ts` — if the method does not exist yet:

```typescript
async updateUser(id: number, data: Partial<CreateUserRequest>): Promise<UserResponse> {
  const body = await this.patch<unknown>(`/users/${id}`, data);
  return userResponseSchema.parse(body);
}

// For negative-path assertions:
async tryUpdateUser(id: number, data: Partial<CreateUserRequest>): Promise<APIResponse> {
  return this.client.patch(`/users/${id}`, { data });
}
```

Use `try*` variants when the test needs to assert on status codes without `ApiError` being thrown.  
(`updateUser` already exists in this repo — add only if you are introducing a **new** endpoint.)

### 3. Implement the stub handler

`stub-servers/users-api.stub-server.ts` — add route handling in `handle()`:

```typescript
// Inside handle(): match PATCH /users/:id
// Return 200 + updated user, or 404 if id not found
```

The stub must mirror the contract your live backend exposes so contract tests
validate the real client code path.

### 4. Add contract tests first

`tests/contract/users.contract.spec.ts` — use `@fixtures/contract.fixture`:

```typescript
import { test, expect } from '@fixtures/contract.fixture';
import { UserFactory } from '@factories/user.factory';
import { qase } from 'playwright-qase-reporter';

test.describe('Users API contract (stub server)', { tag: ['@api'] }, () => {
  test(
    qase(99, 'updates user fields'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const created = await usersApi.createUser(UserFactory.create());
      const updated = await usersApi.updateUser(created.id, { firstName: 'Updated' });
      expect(updated.firstName).toBe('Updated');
    },
  );
});
```

Contract specs **must not** import `@fixtures/api.fixture`.

### 5. Add live API test

`tests/api/users.spec.ts` — use `@fixtures/api.fixture`:

```typescript
test(
  qase(99, 'admin updates user'),
  { tag: ['@regression'] },
  async ({ usersApi }) => {
    const userData = UserFactory.create();
    const created = await usersApi.createUser(userData);

    try {
      const updated = await usersApi.updateUser(created.id, { firstName: 'Live' });
      expect(updated.firstName).toBe('Live');
    } finally {
      await usersApi.deleteUser(created.id);
    }
  },
);
```

Prefer `existingUser` fixture when you need a pre-created user with automatic teardown.

### 6. Run and verify

```bash
# Fast — no backend
npm run test:contract

# Live (needs .env)
npx playwright test tests/api/users.spec.ts --project=api --workers=1
npm run lint
```

---

## Checklist

- [ ] Zod schema updated in `api/models/user.model.ts`
- [ ] Service method in `api/services/users.api.ts` (+ `try*` for negative paths)
- [ ] Stub handler in `stub-servers/users-api.stub-server.ts`
- [ ] Contract spec uses `@fixtures/contract.fixture`
- [ ] Live spec uses `@fixtures/api.fixture` with cleanup
- [ ] Test data via `UserFactory`
- [ ] Tags: `@api` + `@smoke` or `@regression`
- [ ] `npm run test:contract` passes
