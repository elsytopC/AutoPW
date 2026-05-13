import { test as setup } from '@playwright/test';
import { ensureAuthenticated } from '../../utils/auth/authManager';

setup('user auth', async () => {
    await ensureAuthenticated('user');
});