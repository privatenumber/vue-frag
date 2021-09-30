import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';

const babelPlugin = babel({
	extensions: ['.ts'],
	babelHelpers: 'bundled',
	presets: [
		['@babel/preset-env', {
			loose: true,
		}],
	],
});

const rollupConfig = {
	input: 'src/frag.ts',
	plugins: [
		babelPlugin,

		// Strip comments
		terser({
			compress: false,
			mangle: false,
			format: {
				beautify: true,
			},
		}),

		filesize(),
	],
	output: [
		{
			format: 'es',
			file: 'dist/frag.esm.js',
		},
		{
			format: 'cjs',
			file: 'dist/frag.cjs.js',
			exports: 'default',
		},
		{
			format: 'umd',
			file: 'dist/frag.js',
			name: 'Frag',
			exports: 'default',
		},
	],
};

const rollupConfigMin = {
	input: 'src/frag.ts',
	plugins: [
		babelPlugin,

		terser(),
	],
	output: [
		{
			format: 'es',
			file: 'dist/frag.esm.min.js',
		},
		{
			format: 'cjs',
			file: 'dist/frag.cjs.min.js',
			exports: 'default',
		},
		{
			format: 'umd',
			file: 'dist/frag.min.js',
			name: 'Frag',
			exports: 'default',
		},
	],
};

export default [
	rollupConfig,
	rollupConfigMin,
];
