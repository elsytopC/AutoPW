import fs from 'fs';
import { request } from '@playwright/test';
import { env } from '../../config/env';
import { isTokenExpired } from './tokenUtils';
import { authConfig } from './auth.config';
import { UserRole } from './auth.types';

export async function ensureAuthenticated(role: UserRole) {
  const authFile = getAuthFilePath(role);
  ensureAuthDirectory();

  if (!fs.existsSync(authFile)) {
    await generateAuth(role, authFile);
    return;
  }

  const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  const token = state.origins?.[0]?.localStorage?.find(
      (item: { name: string; value: string }) => item.name === 'token',
  )?.value;

  if (!token || isTokenExpired(token)) {
    console.log('Token expired. Regenerating auth...');
    await generateAuth(role, authFile);
  }
}

async function generateAuth(role: UserRole, authFile: string) {
  const appBaseURL = env.uiBaseUrl;
  const authForProd = env.prodAuth;
  const apiBaseURL = env.apiBaseUrl || undefined;
  const credentials = authConfig[role];
  let token: string;

  if (authForProd && apiBaseURL && credentials.email && credentials.password) {
    const context = await request.newContext({ baseURL: apiBaseURL });

    const response = await context.post('/login', {
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to generate auth state for ${role}. Status: ${response.status()}`);
    }

    const responseBody = await response.json();
    token = responseBody.token;

    await context.dispose();
  } else {
    token = createFakeJwt(role);
  }

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: appBaseURL,
        localStorage: [{ name: 'token', value: token }],
      },
    ],
  };

  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2), 'utf-8');
  console.log(`New auth state generated for ${role}`);
}

function getAuthFilePath(role: UserRole): string {
  return `.playwright/auth/${role}.json`;
}

function ensureAuthDirectory(): void {
  fs.mkdirSync('.playwright/auth', { recursive: true });
}

function createFakeJwt(role: UserRole): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  ).toString('base64url');

  return `${header}.${payload}.signature`;
}