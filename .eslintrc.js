module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    mocha: true,
    node: true,
  },
  globals: {
    globalThis: false,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'mocha'],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // https://denar90.github.io/eslint.github.io/docs/rules/
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-extraneous-class': 'error',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    'func-names': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': 'error',
    'no-empty': ['error', {allowEmptyCatch: true}],
    'no-implicit-coercion': 'error',
    'no-negated-condition': 'error',
    'no-undef': 'error',
    'no-underscore-dangle': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-template': 'error',
    'sort-imports': 'error',
    eqeqeq: 'error',
  },
};
