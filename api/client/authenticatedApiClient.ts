import { APIRequestContext, request } from '@playwright/test';

import { env } from '@config/env';
import { authConfig } from '@utils/auth/auth.config';
import { UserRole } from '@utils/auth/auth.types';

export class AuthenticatedApiClient {
  async create(role: UserRole): Promise<APIRequestContext> {
    let token: string;

    const authForProd = env.prodAuth;
    const credentials = authConfig[role];
    const baseURL = env.apiBaseUrl || undefined;

    if (authForProd) {
      if (!credentials.email || !credentials.password) {
        throw new Error(`Missing credentials for ${role}`);
      }

      const authContext = await request.newContext({
        baseURL,
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
      baseURL,

      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
