
const types = {
  features: {
    description: '一项新功能',
    title: 'Features',
    emoji: '💡',
    subject: 'feat',
  },
  bugfix: {
    description: '一个错误修复（开发/测试环境）',
    title: 'Bug Fixes',
    emoji: '🐛',
    subject: 'fix',
  },
  hotfix: {
    description: '一个错误修复（生产环境）',
    title: 'Hot Fixes',
    emoji: '🔥',
    subject: 'fix',
  },
  chore: {
    description: "日常工作、杂项",
    title: 'Chores',
    emoji: '💻',
    subject: 'chore',
  },
  config: {
    description: '配置相关更改',
    title: 'Configuration',
    emoji: '🛠️',
    subject: 'config',
  },
  style: {
    description: '不影响代码意义的变更（空白、格式、缺少分号等）或者样式文件更改（css、less、scss、sass、stylus、styl）',
    title: 'Styles',
    emoji: '💎',
    subject: 'style',
  },
  refactor: {
    description: '代码更改既未修复错误也未添加功能（代码重构）',
    title: 'Code Refactoring',
    emoji: '🛸',
    subject: 'refactor',
  },
  performance: {
    description: '性能优化，提高性能（优化代码）',
    title: 'Performance Improvements',
    emoji: '🚀',
    subject: 'perf',
  },
  revert: {
    description: '撤销之前的提交',
    title: 'Reverts',
    emoji: '💣',
    subject: 'revert',
  },
  document: {
    description: '文档相关更改（README.md、CHANGELOG.md）',
    title: 'Documentation',
    emoji: '📚',
    subject: 'docs',
  },
  test: {
    description: '添加缺失的测试或纠正现有测试（测试代码）',
    title: 'Tests',
    emoji: '🪤',
    subject: 'test',
  },
  cicd: {
    description: '更改CI / CD配置文件和脚本（示例范围：Travis、Circle、BrowserStack、SauceLabs）',
    title: 'Continuous Integrations',
    emoji: '💿',
    subject: 'ci',
  },
  build: {
    description: '影响构建系统或外部依赖项的更改（例如范围：gulp、broccoli、npm、webpack、rollup、vite、esbuild、webpack）',
    title: 'Builds',
    emoji: '📦',
    subject: 'build',
  },
  release: {
    description: '发布版本',
    title: 'Releases',
    emoji: '🎉',
    subject: 'release',
  },
}

module.exports = { types };