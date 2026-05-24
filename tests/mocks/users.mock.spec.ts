import { test, expect } from '@playwright/test';
import { UsersMock } from '../../mocks/users.mock';

test.describe('Users mock', { tag: ['@api'] }, () => {
  test('mocked create user returns id', { tag: ['@smoke'] }, async () => {
    const user = await UsersMock.createUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: '123456',
    });

    expect(user.id).toBeDefined();

    expect(user.firstName).toBe('John');
  });

  test('mocked get user returns user', { tag: ['@smoke'] }, async () => {
    const response = await UsersMock.mockGetUser(1);
    const user = response.body as { id: number };

    expect(user.id).toBe(1);
    expect(response.status).toBe(200);
  });

  test('mocked users list returns array', { tag: ['@regression'] }, async () => {
    const users = await UsersMock.getUsers();

    expect(Array.isArray(users)).toBeTruthy();

    expect(users.length).toBeGreaterThan(0);
  });
});
