import fs from 'fs';
import { request } from '@playwright/test';
import { isTokenExpired } from './tokenUtils';
import { authConfig } from './auth.config';
import { UserRole } from './auth.types';

export async function ensureAuthenticated(role: UserRole) {
    const authFile = `.playwright/auth/${role}.json`;

    if (!fs.existsSync(authFile)) {
        await generateAuth(role, authFile);
        return;
    }

    const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

    const token = state.origins?.[0]?.localStorage?.find(
        (item: any) => item.name === 'token',
    )?.value;

    if (!token || isTokenExpired(token)) {
        console.log('Token expired. Regenerating auth...');
        await generateAuth(role, authFile);
    }
}

async function generateAuth(role: UserRole, authFile: string,) {
    const context = await request.newContext();
    const credentials = authConfig[role];

    const response = await context.post('https://api.example.com/login', {
        data: {
            email: credentials.email,
            password: credentials.password,
        },
    });

    const responseBody = await response.json();

    const token = responseBody.token;

    await context.storageState({
        path: authFile,
    });

    console.log('New auth state generated');
}