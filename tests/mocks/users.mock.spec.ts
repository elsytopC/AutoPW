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
});
