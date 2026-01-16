import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'cjs',
	outDir: 'lib',
	unbundle: true,
	clean: true,
	minify: true,
	copy: [
		{ from: 'postbuild-assets/ajax-config/*', to: 'lib/ajax-config' },
		{ from: 'postbuild-assets/git-local-config', to: 'lib' },
	],
});
