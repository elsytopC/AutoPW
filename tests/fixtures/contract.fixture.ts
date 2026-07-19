import { test as base, request } from '@playwright/test';
import { MockApiServer } from '@mocks/mockServer';
import { ConduitMockServer } from '@mocks/conduitMockServer';
import { UsersApi } from '@api/services/users.api';

type ContractFixtures = {
  mockServer: MockApiServer;
  mockUsersApi: UsersApi;
  conduitMockServer: ConduitMockServer;
};

export const test = base.extend<ContractFixtures>({
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

  conduitMockServer: async ({}, use) => {
    const server = new ConduitMockServer();
    await server.start();
    await use(server);
    await server.stop();
  },
});

export { expect } from '@playwright/test';
