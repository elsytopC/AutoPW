import { test, expect } from '@fixtures/api.fixture';
import { UserFactory } from '@factories/user.factory';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

test.describe(
  'Users API',
  { tag: ['@api'], annotation: behavior('Users API', 'Users') },
  () => {
    test(
      qase(14, 'admin creates user'),
      { tag: ['@smoke'] },
      async ({ usersApi, usersCleanup }) => {
        const user = await test.step('Create user', () =>
          usersApi.createUser(UserFactory.create()));
        usersCleanup.track(user.id);

        await test.step('Verify user id is assigned', () => {
          expect(user.id, 'id is assigned').toBeDefined();
        });
      },
    );

    test(
      qase(15, 'admin gets user'),
      { tag: ['@smoke'] },
      async ({ usersApi, existingUser }) => {
        const user = await test.step('Get user by id', () =>
          usersApi.getUser(existingUser.id));

        await test.step('Verify returned user', () => {
          expect(user.id, 'id of the requested user').toBe(existingUser.id);
          expect(user.email, 'email of the requested user').toBe(
            existingUser.email,
          );
        });
      },
    );

    test(
      qase(16, 'admin gets users list'),
      { tag: ['@regression'] },
      async ({ usersApi, existingUser }) => {
        const users = await test.step('Get users list', () =>
          usersApi.getUsers());

        await test.step('Verify list contains the created user', () => {
          expect(
            users.map((u) => u.id),
            'list contains the created user',
          ).toContain(existingUser.id);
        });
      },
    );

    test(
      qase(17, 'existingUser fixture creates user'),
      { tag: ['@regression'] },
      async ({ existingUser }) => {
        await test.step('Verify fixture user has an id', () => {
          expect(existingUser.id, 'fixture user id').toBeDefined();
        });
      },
    );

    test(
      qase(18, 'returns ApiError on 404'),
      { tag: ['@regression'] },
      async ({ usersApi }) => {
        await test.step('Verify unknown id rejects with 404', () =>
          expect(
            usersApi.getUser(999999),
            'rejects with 404',
          ).rejects.toMatchObject({
            status: 404,
          }));
      },
    );
  },
);
