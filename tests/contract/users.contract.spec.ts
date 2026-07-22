import { test, expect } from '@fixtures/contract.fixture';
import { UserFactory } from '@factories/user.factory';
import { userResponseSchema } from '@api/models/user.model';
import { qase } from 'playwright-qase-reporter';

test.describe('Users API contract (stub server)', { tag: ['@api'] }, () => {
  test(
    qase(19, 'creates user and returns generated id'),
    { tag: ['@smoke'] },
    async ({ usersApi }) => {
      const data = UserFactory.create();

      const user = await usersApi.createUser(data);

      expect(user.id).toBeGreaterThan(0);
      expect(user.email).toBe(data.email);
    },
  );

  test(
    qase(20, 'response payload satisfies the user schema contract'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const user = await usersApi.createUser(UserFactory.create());

      expect(userResponseSchema.safeParse(user).success).toBe(true);
      expect(
        userResponseSchema.safeParse({ ...user, id: 'not-a-number' }).success,
      ).toBe(false);
    },
  );

  test(
    qase(21, 'fetches a seeded user'),
    { tag: ['@smoke'] },
    async ({ usersApi }) => {
      const user = await usersApi.getUser(1);

      expect(user.id).toBe(1);
    },
  );

  test(
    qase(22, 'returns a non-empty users list'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const users = await usersApi.getUsers();

      expect(users.length).toBeGreaterThan(0);
    },
  );

  test(
    qase(23, 'created user is retrievable afterwards'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const created = await usersApi.createUser(UserFactory.create());

      const fetched = await usersApi.getUser(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.email).toBe(created.email);
    },
  );

  test(
    qase(24, 'throws ApiError with status 404 for unknown user'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      await expect(usersApi.getUser(999999)).rejects.toMatchObject({
        name: 'ApiError',
        status: 404,
      });
    },
  );

  test(
    qase(25, 'rejects user creation with per-field validation errors'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const response = await usersApi.tryCreateUser({
        email: 'only@test.com',
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.message).toBe('Invalid user payload');
      expect(body.errors).toMatchObject({
        firstName: 'firstName is required',
        lastName: 'lastName is required',
        password: 'password is required',
      });
      expect(body.errors.email).toBeUndefined();
    },
  );

  test(
    qase(26, 'reports every required field for an empty payload'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const response = await usersApi.tryCreateUser({});

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.errors).toMatchObject({
        firstName: 'firstName is required',
        lastName: 'lastName is required',
        email: 'email is required',
        password: 'password is required',
      });
    },
  );

  test(
    qase(27, 'rejects malformed email with a format error'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const response = await usersApi.tryCreateUser({
        ...UserFactory.create(),
        email: 'not-an-email',
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.errors.email).toBe('email is invalid');
    },
  );

  test(
    qase(28, 'returns 404 response for unknown user without throwing'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const response = await usersApi.tryGetUser(999999);

      expect(response.status()).toBe(404);
      expect(response.ok()).toBe(false);
    },
  );
});
