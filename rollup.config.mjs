import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

const babelPlugin = babel({
	babelHelpers: 'bundled',
	presets: [
		['@babel/preset-env', {
			loose: true,
		}],
	],
});

const nonMinifiedPlugins = [
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
];

const minifiedPlugins = [
	babelPlugin,
	terser(),
];

export default [
	// ESM
	{
		input: 'src/index.esm.js',
		plugins: nonMinifiedPlugins,
		output: {
			format: 'es',
			file: 'dist/frag.esm.js',
		},
	},
	{
		input: 'src/index.esm.js',
		plugins: minifiedPlugins,
		output: {
			format: 'es',
			file: 'dist/frag.esm.min.js',
		},
	},

	// CJS
	{
		input: 'src/index.cjs.js',
		plugins: nonMinifiedPlugins,
		output: {
			format: 'cjs',
			exports: 'default',
			file: 'dist/frag.cjs.js',
		},
	},
	{
		input: 'src/index.cjs.js',
		plugins: minifiedPlugins,
		output: {
			format: 'cjs',
			exports: 'default',
			file: 'dist/frag.cjs.min.js',
		},
	},

	// UMD
	{
		input: 'src/index.cjs.js',
		plugins: nonMinifiedPlugins,
		output: {
			format: 'umd',
			name: 'Frag',
			exports: 'default',
			file: 'dist/frag.js',
		},
	},
	{
		input: 'src/index.cjs.js',
		plugins: minifiedPlugins,
		output: {
			format: 'umd',
			name: 'Frag',
			exports: 'default',
			file: 'dist/frag.min.js',
		},
	},
];
