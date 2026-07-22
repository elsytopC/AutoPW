import { test as base, request } from '@playwright/test';
import { UsersApiStubServer } from '@stub-servers/users-api.stub-server';
import { ConduitApiStubServer } from '@stub-servers/conduit-api.stub-server';
import { UsersApi } from '@api/services/users.api';

type ContractFixtures = {
  usersApiStub: UsersApiStubServer;
  usersApi: UsersApi;
  conduitApiStub: ConduitApiStubServer;
};

export const test = base.extend<ContractFixtures>({
  usersApiStub: async ({}, use) => {
    const server = new UsersApiStubServer();
    await server.start();
    await use(server);
    await server.stop();
  },

  usersApi: async ({ usersApiStub }, use) => {
    const context = await request.newContext({
      baseURL: usersApiStub.baseURL,
    });
    await use(new UsersApi(context));
    await context.dispose();
  },

  conduitApiStub: async ({}, use) => {
    const server = new ConduitApiStubServer();
    await server.start();
    await use(server);
    await server.stop();
  },
});

export { expect } from '@playwright/test';
