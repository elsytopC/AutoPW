import { APIRequestContext } from '@playwright/test';
import { test as base } from '@fixtures/base.fixture';

import { UserFactory } from '@factories/user.factory';
import { UserResponse } from '@api/models/user.model';
import { UsersApi } from '@api/services/users.api';
import { AuthenticatedApiClient } from '@api/client/authenticatedApiClient';

type UsersCleanup = {
  track: (id: number) => void;
};

type ApiFixtures = {
  usersApi: UsersApi;
  adminApiContext: APIRequestContext;
  existingUser: UserResponse;
  usersCleanup: UsersCleanup;
};

export const test = base.extend<ApiFixtures>({
  usersApi: async ({ adminApiContext }, use) => {
    await use(new UsersApi(adminApiContext));
  },

  adminApiContext: async ({}, use) => {
    const client = new AuthenticatedApiClient();

    const context = await client.create('admin');

    await use(context);

    await context.dispose();
  },

  existingUser: async ({ usersApi }, use) => {
    const userData = UserFactory.create();

    const createdUser = await usersApi.createUser(userData);

    await use(createdUser);

    try {
      await usersApi.deleteUser(createdUser.id);
    } catch (error) {
      console.warn(`Failed to clean up user ${createdUser.id}: ${error}`);
    }
  },

  usersCleanup: async ({ usersApi }, use) => {
    const ids: number[] = [];

    await use({ track: (id) => ids.push(id) });

    for (const id of ids) {
      try {
        await usersApi.deleteUser(id);
      } catch (error) {
        console.warn(`Failed to clean up user ${id}: ${error}`);
      }
    }
  },
});

export { expect } from '@playwright/test';
