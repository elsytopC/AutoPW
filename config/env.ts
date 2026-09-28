import { z } from 'zod';

const envSchema = z
  .object({
    PROD_AUTH: z.enum(['true', 'false']).default('false'),
    API_BASE_URL: z.url().optional(),
    CONDUIT_API_URL: z.url().default('https://api.realworld.show/api'),
    CONDUIT_UI_URL: z.url().default('https://demo.realworld.show'),
    BASE_URL: z.url().optional(),
    UI_BASE_URL: z.url().optional(),
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    USER_EMAIL: z.string().optional(),
    USER_PASSWORD: z.string().optional(),
  })
  .superRefine((vars, ctx) => {
    if (vars.PROD_AUTH !== 'true') {
      return;
    }
    if (!vars.API_BASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['API_BASE_URL'],
        message: 'required when PROD_AUTH=true',
      });
    }
    if (!vars.ADMIN_EMAIL || !vars.ADMIN_PASSWORD) {
      ctx.addIssue({
        code: 'custom',
        path: ['ADMIN_EMAIL'],
        message:
          'ADMIN_EMAIL and ADMIN_PASSWORD are required when PROD_AUTH=true',
      });
    }
  });

// `.env.example` ships keys with empty values — treat them as unset.
const definedVars = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== ''),
);

const parsed = envSchema.safeParse(definedVars);

if (!parsed.success) {
  throw new Error(
    `Invalid test configuration:\n${z.prettifyError(parsed.error)}`,
  );
}

const vars = parsed.data;

export const env = {
  prodAuth: vars.PROD_AUTH === 'true',

  apiBaseUrl: vars.API_BASE_URL ?? '',

  conduitApiUrl: vars.CONDUIT_API_URL,

  conduitUiUrl: vars.CONDUIT_UI_URL,

  uiBaseUrl: vars.BASE_URL ?? vars.UI_BASE_URL ?? 'https://demo.playwright.dev',

  credentials: {
    admin: {
      email: vars.ADMIN_EMAIL,
      password: vars.ADMIN_PASSWORD,
    },
    user: {
      email: vars.USER_EMAIL,
      password: vars.USER_PASSWORD,
    },
  },
} as const;
