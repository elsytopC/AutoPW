import { test, expect } from '../fixtures/api.fixture';
import { UserFactory } from '../../factories/user.factory';

test.describe('Users API', { tag: ['@api'] }, () => {
  test('admin creates user', { tag: ['@smoke'] }, async ({ usersApi }) => {
    const userData = UserFactory.create();

    const user = await usersApi.createUser(userData);

    expect(user.id).toBeDefined();
  });

  test('admin gets user', { tag: ['@smoke'] }, async ({ usersApi }) => {
    const user = await usersApi.getUser(1);

    expect(user.id).toBe(1);
  });

  test('admin gets users list', { tag: ['@regression'] }, async ({ usersApi }) => {
    const users = await usersApi.getUsers();

    expect(users.length).toBeGreaterThan(0);
  });

  test('existingUser fixture creates user', { tag: ['@regression'] }, async ({ existingUser }) => {
    expect(existingUser.id).toBeDefined();
  });

  // TODO:
  // Enable after contract-level auth mock server is implemented.
  test.skip('adminApiContext contains auth header', async ({
    adminApiContext,
  }) => {
    const response = await adminApiContext.get('/users');

    expect(response.ok()).toBeTruthy();
  });

  test('returns ApiError on 404', { tag: ['@regression'] }, async ({ usersApi }) => {
    await expect(usersApi.getUser(999999)).rejects.toMatchObject({
      status: 404,
    });
  });
});
