import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'cjs',
	outDir: 'lib',
	unbundle: true,
	clean: true,
	minify: true,
	copy: [
		{ from: 'postbuild-assets/request-templates/_shared/*', to: 'lib/request-templates/_shared' },
		{ from: 'postbuild-assets/request-templates/axios/*', to: 'lib/request-templates/axios' },
		{ from: 'postbuild-assets/request-templates/fetch/*', to: 'lib/request-templates/fetch' },
		{ from: 'postbuild-assets/request-templates/wx/*', to: 'lib/request-templates/wx' },
		{ from: 'postbuild-assets/request-templates/uniapp/*', to: 'lib/request-templates/uniapp' },
		{ from: 'postbuild-assets/request-templates/taro/*', to: 'lib/request-templates/taro' },
		{ from: 'postbuild-assets/git-local-config', to: 'lib' },
		{ from: 'postbuild-assets/skills', to: 'lib' },
	],
});
