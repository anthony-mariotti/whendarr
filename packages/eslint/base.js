import { globalIgnores } from 'eslint/config';
import js from '@eslint/js';

import configPrettier from 'eslint-config-prettier';
import configTypescript from 'typescript-eslint';

import pluginTurbo from 'eslint-plugin-turbo';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**']),
  js.configs.recommended,
  configPrettier,
  ...configTypescript.configs.recommended,
  {
    plugins: {
      turbo: pluginTurbo
    }
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  }
];
