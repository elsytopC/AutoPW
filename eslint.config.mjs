import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const noRealCredentials = [
  {
    selector:
      "MemberExpression[object.name='env'][property.name='credentials']",
    message:
      'Real credentials must not reach specs or page objects: authenticate via API / storageState and use factory data in the UI.',
  },
  {
    selector:
      "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/^(ADMIN|USER)_(EMAIL|PASSWORD)$/]",
    message:
      'Real credentials must not reach specs or page objects: authenticate via API / storageState and use factory data in the UI.',
  },
];

const noUnguardedTyping = {
  selector:
    "CallExpression[callee.property.name=/^(fill|pressSequentially|type)$/]:not([callee.object.type='ThisExpression'])",
  message:
    'Type text through BasePage.fill() so real credentials are rejected before reaching the UI.',
};

export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'allure-results/**',
      'allure-report/**',
      'allure-history/**',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],

    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    rules: {
      'no-console': 'off',
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },

  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...noRealCredentials],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@utils/auth/auth.config',
              message:
                'Real credentials are for API login only (utils/auth/authManager.ts).',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['tests/pages/**/*.ts'],
    ignores: ['tests/pages/base.page.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...noRealCredentials,
        noUnguardedTyping,
      ],
    },
  },

  // Must be last so formatting rules never conflict with Prettier.
  prettier,
];
