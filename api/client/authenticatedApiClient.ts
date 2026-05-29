import { APIRequestContext, request } from '@playwright/test';

import { env } from '@config/env';
import { authConfig } from '@utils/auth/auth.config';
import { requestAuthToken } from '@utils/auth/login';
import { UserRole } from '@utils/auth/auth.types';

export class AuthenticatedApiClient {
  async create(role: UserRole): Promise<APIRequestContext> {
    const baseURL = env.apiBaseUrl || undefined;
    const token = await this.resolveToken(role);

    return request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private async resolveToken(role: UserRole): Promise<string> {
    if (!env.prodAuth) {
      return `fake-jwt-token-${role}`;
    }

    const credentials = authConfig[role];

    if (!credentials.email || !credentials.password) {
      throw new Error(`Missing credentials for ${role}`);
    }

    return requestAuthToken(env.apiBaseUrl, {
      email: credentials.email,
      password: credentials.password,
    });
  }
}
