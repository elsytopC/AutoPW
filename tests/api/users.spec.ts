import { test, expect } from '@fixtures/api.fixture';
import { UserFactory } from '@factories/user.factory';
import { qase } from 'playwright-qase-reporter';

test.describe('Users API', { tag: ['@api'] }, () => {
  test(
    qase(14, 'admin creates user'),
    { tag: ['@smoke'] },
    async ({ usersApi }) => {
      const userData = UserFactory.create();

      const user = await usersApi.createUser(userData);

      expect(user.id).toBeDefined();
    },
  );

  test(
    qase(15, 'admin gets user'),
    { tag: ['@smoke'] },
    async ({ usersApi }) => {
      const user = await usersApi.getUser(1);

      expect(user.id).toBe(1);
    },
  );

  test(
    qase(16, 'admin gets users list'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      const users = await usersApi.getUsers();

      expect(users.length).toBeGreaterThan(0);
    },
  );

  test(
    qase(17, 'existingUser fixture creates user'),
    { tag: ['@regression'] },
    async ({ existingUser }) => {
      expect(existingUser.id).toBeDefined();
    },
  );

  test(
    qase(18, 'returns ApiError on 404'),
    { tag: ['@regression'] },
    async ({ usersApi }) => {
      await expect(usersApi.getUser(999999)).rejects.toMatchObject({
        status: 404,
      });
    },
  );
});
