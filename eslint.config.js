import js from '@eslint/js'
import globals from 'globals'
import { FlatCompat } from '@eslint/eslintrc'
import { fixupConfigRules } from '@eslint/compat'
const compat = new FlatCompat()

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**'
    ]
  },
  js.configs.recommended,
  ...fixupConfigRules(compat.extends('airbnb-base')),
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        AbortController: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        TextDecoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'require-await': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': 'error',
      'no-undef': 'off',
      'no-constant-condition': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'import/no-unresolved': 'off',
      'import/newline-after-import': 'off',
      'import/order': 'off',
      'import/prefer-default-export': 'off',
      'func-names': 'off',
      semi: 'off',
      'semi-style': 'off',
      'comma-dangle': 'off',
      'array-bracket-spacing': 'off',
      'object-curly-newline': 'off',
      'arrow-parens': 'off',
      'prefer-template': 'off',
      'no-use-before-define': 'off',
      'consistent-return': 'off',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
      'quote-props': 'off',
      'max-len': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
      'no-cond-assign': 'off',
      'no-continue': 'off',
      'operator-linebreak': 'off',
      'default-param-last': 'off',
      'one-var': 'off',
      'one-var-declaration-per-line': 'off',
      'no-promise-executor-return': 'off',
      'no-underscore-dangle': 'off',
      'no-trailing-spaces': 'off',
      'class-methods-use-this': 'off',
      'prefer-destructuring': 'off',
      'no-param-reassign': 'off',
      'default-case': 'off'
    }
  }
]
