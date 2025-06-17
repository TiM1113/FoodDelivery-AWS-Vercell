import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

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
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'no-unused-vars': [
				'warn', 
				{ 
					varsIgnorePattern: '^React$',
					argsIgnorePattern: '^_',
				}
			],
			'react/prop-types': 'off',
			'react/react-in-jsx-scope': 'off',
			'no-undef': 'off',
			'no-implicit-globals': 'off',
		},
	},
];
