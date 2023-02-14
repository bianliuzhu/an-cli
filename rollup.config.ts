import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import builtins from 'rollup-plugin-node-builtins';

export default defineConfig({
	input: 'src/index.ts',
	output: {
		dir: 'lib',
		format: 'cjs',
		sourcemap: false,
	},
	plugins: [
		json(),
		builtins(),
		typescript({
			tsconfig: './tsconfig.json',
			module: 'esnext',
		}),
		resolve({
			preferBuiltins: false,
		}),
		commonjs({ extensions: ['.js', '.ts'] }),
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
			extensions: ['.js', '.ts'],
		}),
	],
});
