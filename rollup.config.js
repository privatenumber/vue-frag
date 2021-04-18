import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';

const isProduction = process.env.NODE_ENV === 'production';

const rollupConfig = {
	input: 'src/frag.js',
	plugins: [
		babel(),
		isProduction && terser(),
		isProduction && filesize(),
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

export default rollupConfig;
