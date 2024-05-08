// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

const enforceNoConsolePlugin = require('./rules/enforceNoConsolePlugin.js');

module.exports = [
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
