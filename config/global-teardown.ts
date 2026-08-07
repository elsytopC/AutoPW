import { rm } from 'node:fs/promises';
import path from 'node:path';

async function globalTeardown(): Promise<void> {
  const authDir = path.resolve('.playwright/auth');
  await rm(authDir, { recursive: true, force: true });
}

export default globalTeardown;
