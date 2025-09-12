export default [
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2021, sourceType: 'module' },
    rules: {
      semi: ['error', 'never'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2]
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { fetch: 'readonly', Response: 'readonly' }
    }
  }
]
