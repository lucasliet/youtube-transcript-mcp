import js from '@eslint/js'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import'
import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: moduleDir, resolvePluginsRelativeTo: moduleDir })

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ]
  },
  ...compat.extends('airbnb-base'),
  js.configs.recommended,
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
    plugins: {
      import: importPlugin
    },
    settings: {
      'import/extensions': ['.js'],
      'import/resolver': {
        node: {
          extensions: ['.js']
        }
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'require-await': 'off',
      'no-undef': 'off',
      'no-constant-condition': 'off',
      'import/no-unresolved': ['error', { ignore: ['^@modelcontextprotocol/sdk'] }],
      'import/no-extraneous-dependencies': ['error', { devDependencies: ['tests/**/*.test.js', 'specs/**', 'scripts/**', 'c8.config.json', 'eslint.config.js'] }],
      'import/order': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
      'no-shadow': 'error',
      'no-param-reassign': ['error', { props: false }],
      'prefer-const': 'error',
      'object-shorthand': ['error', 'always'],
      semi: ['error', 'never'],
      'comma-dangle': ['error', 'never'],
      'max-len': ['error', { code: 140, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      'quote-props': ['error', 'as-needed'],
      'no-plusplus': 'off',
      'no-use-before-define': ['error', { functions: false, classes: true, variables: false }],
      'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
      'no-await-in-loop': 'off',
      'object-curly-newline': 'off',
      'one-var': 'off',
      'one-var-declaration-per-line': 'off',
      'array-bracket-spacing': ['error', 'never'],
      'prefer-destructuring': 'off',
      'prefer-template': 'off',
      'class-methods-use-this': 'off',
      'no-underscore-dangle': ['error', { allow: ['__testables', '_requestHandlers'] }]
    }
  }
]
