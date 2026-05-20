import { test, expect } from '../fixtures/api.fixture';

test.describe('Users mock', () => {
  test('mocked create user returns id', async ({ usersApi }) => {
    const user = await usersApi.createUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: '123456',
    });

    expect(user.id).toBeDefined();

    expect(user.firstName).toBe('John');
  });

  test('mocked get user returns user', async ({ usersApi }) => {
    const user = await usersApi.getUser(1);

    expect(user.id).toBe(1);
  });

  test('mocked users list returns array', async ({ usersApi }) => {
    const users = await usersApi.getUsers();

    expect(Array.isArray(users)).toBeTruthy();

    expect(users.length).toBeGreaterThan(0);
  });
});
