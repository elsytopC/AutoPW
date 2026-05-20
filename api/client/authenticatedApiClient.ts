import { APIRequestContext, request } from '@playwright/test';

import { authConfig } from '../../utils/auth/auth.config';

import { UserRole } from '../../utils/auth/auth.types';

export class AuthenticatedApiClient {
  async create(role: UserRole): Promise<APIRequestContext> {
    const credentials = authConfig[role];

    if (!credentials.email || !credentials.password) {
      throw new Error(`Missing credentials for ${role}`);
    }

    let token: string;

    const authForProd = process.env.PROD_AUTH === 'true';

    if (authForProd) {
      const authContext = await request.newContext({
        baseURL: process.env.API_BASE_URL,
      });

      const response = await authContext.post('/login', {
        data: {
          email: credentials.email,
          password: credentials.password,
        },
      });

      if (!response.ok()) {
        throw new Error(
          `Authentication failed for role "${role}". Status: ${response.status()}`,
        );
      }

      const body = await response.json();

      token = body.token;

      if (!token) {
        throw new Error(`Token was not returned for role "${role}"`);
      }

      await authContext.dispose();
    } else {
      // mock auth mode
      token = `fake-jwt-token-${role}`;
    }

    return await request.newContext({
      baseURL: process.env.API_BASE_URL,

      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
