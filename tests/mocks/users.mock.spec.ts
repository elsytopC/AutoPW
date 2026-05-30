import { test, expect } from '@fixtures/mock.fixture';
import { UserFactory } from '@factories/user.factory';

test.describe('Users API against mock server', { tag: ['@api'] }, () => {
  test(
    'creates user and returns generated id',
    { tag: ['@smoke'] },
    async ({ mockUsersApi }) => {
      const data = UserFactory.create();

      const user = await mockUsersApi.createUser(data);

      expect(user.id).toBeGreaterThan(0);
      expect(user.email).toBe(data.email);
    },
  );

  test(
    'fetches a seeded user',
    { tag: ['@smoke'] },
    async ({ mockUsersApi }) => {
      const user = await mockUsersApi.getUser(1);

      expect(user.id).toBe(1);
    },
  );

  test(
    'returns a non-empty users list',
    { tag: ['@regression'] },
    async ({ mockUsersApi }) => {
      const users = await mockUsersApi.getUsers();

      expect(users.length).toBeGreaterThan(0);
    },
  );

  test(
    'created user is retrievable afterwards',
    { tag: ['@regression'] },
    async ({ mockUsersApi }) => {
      const created = await mockUsersApi.createUser(UserFactory.create());

      const fetched = await mockUsersApi.getUser(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.email).toBe(created.email);
    },
  );

  test(
    'throws ApiError with status 404 for unknown user',
    { tag: ['@regression'] },
    async ({ mockUsersApi }) => {
      await expect(mockUsersApi.getUser(999999)).rejects.toMatchObject({
        name: 'ApiError',
        status: 404,
      });
    },
  );

  test(
    'rejects user creation with per-field validation errors',
    { tag: ['@regression'] },
    async ({ mockUsersApi }) => {
      const response = await mockUsersApi.tryCreateUser({
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
    'reports every required field for an empty payload',
    { tag: ['@regression'] },
    async ({ mockUsersApi }) => {
      const response = await mockUsersApi.tryCreateUser({});

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
    'rejects malformed email with a format error',
    { tag: ['@regression'] },
    async ({ mockUsersApi }) => {
      const response = await mockUsersApi.tryCreateUser({
        ...UserFactory.create(),
        email: 'not-an-email',
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.errors.email).toBe('email is invalid');
    },
  );

  test(
    'returns 404 response for unknown user without throwing',
    { tag: ['@regression'] },
    async ({ mockUsersApi }) => {
      const response = await mockUsersApi.tryGetUser(999999);

      expect(response.status()).toBe(404);
      expect(response.ok()).toBe(false);
    },
  );
});
