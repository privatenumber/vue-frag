import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import esbuild from 'rollup-plugin-esbuild';

const rollupConfig = {
	input: 'src/frag.ts',
	plugins: [
		esbuild(),
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
		esbuild({
			minify: true,
		}),
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

export default [rollupConfig, rollupConfigMin];
