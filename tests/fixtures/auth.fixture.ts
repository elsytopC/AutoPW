import { test as base } from '@playwright/test';

export const adminAuth = base.extend({
    storageState: '.playwright/auth/admin.json',
});

export const userAuth = base.extend({
    storageState: '.playwright/auth/user.json',
});