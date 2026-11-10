import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const reactHooksConfig = reactHooks.configs.flat?.recommended ?? reactHooks.configs.recommended;

export default [
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/routeTree.gen.ts',
      '**/clients/generated/**',
      '**/playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooksConfig,
  jsxA11y.flatConfigs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
];
