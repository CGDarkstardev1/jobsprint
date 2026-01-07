/**
 * ESLint Configuration for Jobsprint
 */

module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'airbnb-base'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'no-console': 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'max-len': ['error', { code: 120 }],
        'consistent-return': 'warn',
        'prefer-destructuring': 'warn'
    },
    globals: {
        'puter': 'readonly'
    }
};
