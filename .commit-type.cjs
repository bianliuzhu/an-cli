
const types = {
	features: {
		description: 'A new feature',
		title: 'Features',
		emoji: '💡',
		subject: 'feat',
	},
	bugfix: {
		description: 'A bug fix (development/test environment)',
		title: 'Bug Fixes',
		emoji: '🐛',
		subject: 'fix',
	},
	hotfix: {
		description: 'A bug fix (production environment)',
		title: 'Hot Fixes',
		emoji: '🔥',
		subject: 'fix',
	},
	chore: {
		description: "Daily work, miscellaneous",
		title: 'Chores',
		emoji: '💻',
		subject: 'chore',
	},
	config: {
		description: 'Configuration changes',
		title: 'Configuration',
		emoji: '🔧',
		subject: 'config',
	},
	style: {
		description: 'Non-functional changes (whitespace, formatting, missing semicolons) or style file changes (css, less, scss, sass, stylus, styl)',
		title: 'Styles',
		emoji: '💎',
		subject: 'style',
	},
	refactor: {
		description: 'Code changes that neither fix bugs nor add features (code refactoring)',
		title: 'Code Refactoring',
		emoji: '🛸',
		subject: 'refactor',
	},
	performance: {
		description: 'Performance optimization, improve performance (optimize code)',
		title: 'Performance Improvements',
		emoji: '🚀',
		subject: 'perf',
	},
	revert: {
		description: 'Revert previous commits',
		title: 'Reverts',
		emoji: '💣',
		subject: 'revert',
	},
	document: {
		description: 'Document changes (README.md, CHANGELOG.md)',
		title: 'Documentation',
		emoji: '📚',
		subject: 'docs',
	},
	test: {
		description: 'Add missing tests or correct existing tests (test code)',
		title: 'Tests',
		emoji: '🧪',
		subject: 'test',
	},
	cicd: {
		description: 'Change CI / CD configuration files and scripts (example scope: Travis, Circle, BrowserStack, SauceLabs)',
		title: 'Continuous Integrations',
		emoji: '💿',
		subject: 'ci',
	},
	build: {
		description: 'Changes affecting the build system or external dependencies (example scope: gulp, broccoli, npm, webpack, rollup, vite, esbuild, webpack)',
		title: 'Builds',
		emoji: '📦',
		subject: 'build',
	},
	release: {
		description: 'Release version',
		title: 'Releases',
		emoji: '🎉',
		subject: 'release',
	},
}

module.exports = { types };