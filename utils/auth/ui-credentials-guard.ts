import { env } from '@config/env';

const realCredentials = new Set(
  [
    env.credentials.admin.email,
    env.credentials.admin.password,
    env.credentials.user.email,
    env.credentials.user.password,
  ].filter((value): value is string => Boolean(value)),
);

export function isRealCredential(value: string): boolean {
  return realCredentials.has(value);
}

export function assertNotRealCredential(value: string): void {
  if (isRealCredential(value)) {
    throw new Error(
      'Refusing to type a real account credential into the UI. ' +
        'Use factory data, or authenticate via API / storageState instead.',
    );
  }
}
