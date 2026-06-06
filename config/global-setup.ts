import { env } from './env';

/**
 * Runs once before the whole suite. Validates configuration so the run fails
 * fast (with a clear message) instead of every test erroring out later, and
 * logs a concise banner describing how this run is configured.
 */
async function globalSetup(): Promise<void> {
  const configErrors: string[] = [];

  if (env.prodAuth) {
    if (!env.apiBaseUrl) {
      configErrors.push('API_BASE_URL is required when PROD_AUTH=true');
    }
    if (!env.credentials.admin.email || !env.credentials.admin.password) {
      configErrors.push(
        'ADMIN_EMAIL and ADMIN_PASSWORD are required when PROD_AUTH=true',
      );
    }
  }

  if (configErrors.length > 0) {
    throw new Error(
      `Invalid test configuration:\n  - ${configErrors.join('\n  - ')}`,
    );
  }

  console.log(
    [
      '── Test run configuration ──',
      `  Auth mode : ${env.prodAuth ? 'production (real login)' : 'mock JWT'}`,
      `  UI base   : ${env.uiBaseUrl}`,
      `  API base  : ${env.apiBaseUrl || '(not set)'}`,
      `  Conduit   : ${env.conduitUiUrl} → ${env.conduitApiUrl}`,
      '────────────────────────────',
    ].join('\n'),
  );
}

export default globalSetup;
