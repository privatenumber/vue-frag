import { defineConfig, pvtnbr } from 'lintroll';

export default defineConfig([
	...pvtnbr(),

	{
		files: ['**/*.md/**'],
		rules: {
			'vue/multi-word-component-names': 'off',
			'vue/multiline-html-element-content-newline': 'off',
		},
	},

	{
		files: ['src/**/*'],
		languageOptions: {
			globals: {
				document: 'readonly',
				Node: 'readonly',
			},
		},
		rules: {
			'symbol-description': 'off',
			'unicorn/prefer-at': 'off',
		},
	},
]);
