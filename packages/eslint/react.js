import { config as base } from './base';

import globals from 'globals';

import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

/**
 * ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  ...base,
  ...pluginReact.configs.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser
      }
    }
  },
  {
    plugins: {
      'react-hooks': pluginReactHooks
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off'
    }
  }
];
