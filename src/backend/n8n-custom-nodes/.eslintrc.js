module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	extends: [
		'plugin:n8n-nodes-base/recommended',
	],
	plugins: ['@typescript-eslint'],
	rules: {
		'n8n-nodes-base/node-class-description-converters-missing': 'off',
		'n8n-nodes-base/node-class-description-icons-not-svg': 'off',
		'n8n-nodes-base/node-class-description-wrong-namespace': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'warn',
		'no-console': 'off',
	},
};
