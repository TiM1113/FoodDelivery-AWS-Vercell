import js from '@eslint/js';
import globals from 'globals';

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,jsx}'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				process: true,
			},
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			'no-unused-vars': 'warn',
			'react/prop-types': 'off',
			'no-undef': 'off',
			'no-implicit-globals': 'off',
		},
	},
];
