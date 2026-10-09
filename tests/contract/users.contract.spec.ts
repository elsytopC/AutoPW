import { test, expect } from '@fixtures/contract.fixture';
import { UserFactory } from '@factories/user.factory';
import { userResponseSchema } from '@api/models/user.model';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'Users API contract (stub server)',
  {
    tag: ['@api', '@contract'],
    annotation: behavior('Users API', 'Users contract'),
  },
  () => {
    test(
      qase(19, 'creates user and returns generated id'),
      { tag: ['@smoke'] },
      async ({ usersApi }) => {
        const data = UserFactory.create();

        const user = await test.step('Create user', () =>
          usersApi.createUser(data));

        await test.step('Verify generated id and echoed email', () => {
          expect(user.id).toBeGreaterThan(0);
          expect(user.email).toBe(data.email);
        });
      },
    );

    test(
      qase(20, 'response payload satisfies the user schema contract'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        const user = await test.step('Create user', () =>
          usersApi.createUser(UserFactory.create()));

        await test.step('Verify payload matches the schema', () => {
          expect(userResponseSchema.safeParse(user).success).toBe(true);
        });

        await test.step('Verify schema rejects a non-numeric id', () => {
          expect(
            userResponseSchema.safeParse({ ...user, id: 'not-a-number' })
              .success,
          ).toBe(false);
        });
      },
    );

    test(
      qase(21, 'fetches a seeded user'),
      { tag: ['@smoke'] },
      async ({ usersApi }) => {
        const user = await test.step('Get seeded user by id', () =>
          usersApi.getUser(1));

        await test.step('Verify returned id', () => {
          expect(user.id).toBe(1);
        });
      },
    );

    test(
      qase(22, 'returns a non-empty users list'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        const users = await test.step('Get users list', () =>
          usersApi.getUsers());

        await test.step('Verify list is not empty', () => {
          expect(users.length).toBeGreaterThan(0);
        });
      },
    );

    test(
      qase(23, 'created user is retrievable afterwards'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        const created = await test.step('Create user', () =>
          usersApi.createUser(UserFactory.create()));

        const fetched = await test.step('Get created user by id', () =>
          usersApi.getUser(created.id));

        await test.step('Verify fetched user matches created user', () => {
          expect(fetched.id).toBe(created.id);
          expect(fetched.email).toBe(created.email);
        });
      },
    );

    test(
      qase(24, 'throws ApiError with status 404 for unknown user'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        await test.step('Verify unknown id rejects with ApiError 404', () =>
          expect(usersApi.getUser(999999)).rejects.toMatchObject({
            name: 'ApiError',
            status: 404,
          }));
      },
    );

    test(
      qase(25, 'rejects user creation with per-field validation errors'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        const response = await test.step('Create user with email only', () =>
          usersApi.tryCreateUser({ email: 'only@test.com' }));

        await test.step('Verify 400 status', () => {
          expect(response.status()).toBe(400);
        });

        await test.step('Verify errors for every missing field', async () => {
          const body = await response.json();
          expect(body.message).toBe('Invalid user payload');
          expect(body.errors).toMatchObject({
            firstName: 'firstName is required',
            lastName: 'lastName is required',
            password: 'password is required',
          });
          expect(body.errors.email).toBeUndefined();
        });
      },
    );

    test(
      qase(26, 'reports every required field for an empty payload'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        const response = await test.step('Create user with empty payload', () =>
          usersApi.tryCreateUser({}));

        await test.step('Verify 400 status', () => {
          expect(response.status()).toBe(400);
        });

        await test.step('Verify errors for all required fields', async () => {
          const body = await response.json();
          expect(body.errors).toMatchObject({
            firstName: 'firstName is required',
            lastName: 'lastName is required',
            email: 'email is required',
            password: 'password is required',
          });
        });
      },
    );

    test(
      qase(27, 'rejects malformed email with a format error'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        const response =
          await test.step('Create user with malformed email', () =>
            usersApi.tryCreateUser({
              ...UserFactory.create(),
              email: 'not-an-email',
            }));

        await test.step('Verify 400 status', () => {
          expect(response.status()).toBe(400);
        });

        await test.step('Verify email format error', async () => {
          const body = await response.json();
          expect(body.errors.email).toBe('email is invalid');
        });
      },
    );

    test(
      qase(28, 'returns 404 response for unknown user without throwing'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        const response = await test.step('Get unknown user', () =>
          usersApi.tryGetUser(999999));

        await test.step('Verify 404 response', () => {
          expect(response.status()).toBe(404);
          expect(response.ok()).toBe(false);
        });
      },
    );
  },
);
