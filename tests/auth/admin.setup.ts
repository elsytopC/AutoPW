import { test as setup } from '@playwright/test';
import { ensureAuthenticated } from '../../utils/auth/authManager';

setup('admin auth', async () => {
    await ensureAuthenticated('admin');
});