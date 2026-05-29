import { request } from '@playwright/test';

export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Performs a real /login request against the given API base URL and returns
 * the auth token. Shared by the API client and the UI storageState bootstrap
 * so the login contract lives in a single place.
 */
export async function requestAuthToken(
  baseURL: string,
  credentials: LoginCredentials,
): Promise<string> {
  const context = await request.newContext({ baseURL });

  try {
    const response = await context.post('/login', { data: credentials });

    if (!response.ok()) {
      throw new Error(`Login failed. Status: ${response.status()}`);
    }

    const body = await response.json();

    if (!body.token) {
      throw new Error('Login response did not contain a token');
    }

    return body.token;
  } finally {
    await context.dispose();
  }
}
