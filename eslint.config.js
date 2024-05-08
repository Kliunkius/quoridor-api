// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

import enforceNoConsolePlugin from './rules/enforceNoConsolePlugin.js';

export default [
  {
    plugins: {
      console: enforceNoConsolePlugin
    },
    rules: {
      'console/enforce-no-console': 'error'
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic
];
