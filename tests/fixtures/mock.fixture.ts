import { test as base, request } from '@playwright/test';
import { MockApiServer } from '@mocks/mockServer';
import { UsersApi } from '@api/services/users.api';

type MockFixtures = {
  mockServer: MockApiServer;
  mockUsersApi: UsersApi;
};

export const test = base.extend<MockFixtures>({
  mockServer: async ({}, use) => {
    const server = new MockApiServer();
    await server.start();
    await use(server);
    await server.stop();
  },

  mockUsersApi: async ({ mockServer }, use) => {
    const context = await request.newContext({ baseURL: mockServer.baseURL });
    await use(new UsersApi(context));
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
