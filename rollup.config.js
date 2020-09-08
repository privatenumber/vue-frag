import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';

const isProd = process.env.NODE_ENV === 'production';

const rollupConfig = {
	input: 'src/frag.js',
	plugins: [
		babel(),
		isProd && terser(),
		isProd && filesize(),
	],
	output: [
		{
			format: 'es',
			file: 'dist/frag.esm.js',
		},
		{
			format: 'cjs',
			file: 'dist/frag.cjs.js',
			exports: 'named',
		},
		{
			format: 'umd',
			file: 'dist/frag.js',
			name: 'Frag',
			exports: 'named',
		},
	],
};

export default rollupConfig;
