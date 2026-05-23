import { test as base, APIRequestContext } from '@playwright/test';

import { UserFactory } from '../../factories/user.factory';
import { UserResponse } from '../../api/models/user.model';
import { UsersApi } from '../../api/services/users.api';
import { AuthApi } from '../../api/services/auth.api';
import { AuthenticatedApiClient } from '../../api/client/authenticatedApiClient';

type ApiFixtures = {
  usersApi: UsersApi;
  authApi: AuthApi;
  adminApiContext: APIRequestContext;
  existingUser: UserResponse;
};

export const test = base.extend<ApiFixtures>({
  usersApi: async ({ adminApiContext }, use) => {
    await use(new UsersApi(adminApiContext));
  },

  authApi: async ({ adminApiContext }, use) => {
    await use(new AuthApi(adminApiContext));
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

    await usersApi.deleteUser(createdUser.id);
  },
});

export { expect } from '@playwright/test';
