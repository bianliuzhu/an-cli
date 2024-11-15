import { defineConfig } from 'rollup';
/** 将json转换为ES6模块 */
import json from '@rollup/plugin-json';
/** rollup解析及编译TS插件 */
import typescript from '@rollup/plugin-typescript';
/** 解析代码中依赖的node_modules */
import resolve from '@rollup/plugin-node-resolve';
/** 将 CommonJS 模块转换为 ES6 的 Rollup 插件 */
import commonjs from '@rollup/plugin-commonjs';
/** rollup文件夹清除插件 */
import { cleandir } from 'rollup-plugin-cleandir';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
	/** 打包入口文件 */
	input: './src/index.ts',
	/** 输出配置 */
	output: {
		/** 输出目录 */
		dir: './lib',
		/** 输出文件为 CommonJS格式 */
		format: 'cjs',
		preserveModules: true,
		exports: 'named',
	},
	plugins: [
		/** 配置插件 - 每次打包清除目标文件 */
		cleandir('./lib'),
		/** 配置插件 - 将json转换为ES6模块 */
		json(),
		/** 配置插件 - 将json转换为ES6模块 */
		typescript({
			module: 'esnext',
			exclude: ['./node_modules/**'],
		}),
		resolve({
			extensions: ['.js', '.ts', '.json'],
			modulesOnly: true,
			preferBuiltins: false,
		}),
		commonjs({ extensions: ['.js', '.ts', '.json'] }),
		terser(),
	],
	/** 排除打包的模块 */
	external: ['chalk', 'ora', 'axios'],
});
