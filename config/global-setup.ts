import { env } from './env';

async function globalSetup(): Promise<void> {
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
