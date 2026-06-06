export const env = {
  prodAuth: process.env.PROD_AUTH === 'true',

  apiBaseUrl: process.env.API_BASE_URL ?? '',

  conduitApiUrl:
    process.env.CONDUIT_API_URL ?? 'https://api.realworld.show/api',

  conduitUiUrl: process.env.CONDUIT_UI_URL ?? 'https://demo.realworld.show',

  uiBaseUrl:
    process.env.BASE_URL ??
    process.env.UI_BASE_URL ??
    'https://demo.playwright.dev',

  credentials: {
    admin: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
    user: {
      email: process.env.USER_EMAIL,
      password: process.env.USER_PASSWORD,
    },
  },
} as const;
