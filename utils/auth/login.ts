import { request } from '@playwright/test';

export type LoginCredentials = {
  email: string;
  password: string;
};

/** Shared /login contract for API client and UI storageState bootstrap. */
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
