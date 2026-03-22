# `anl git` 命令

### 功能概述

- 通过交互式多选，为当前仓库应用以下 Git 能力：
  - gitflow 标准分支创建
    - 将 `.gitscripts/`、`.gitconfig`、`.commit-type.cjs` 复制到项目（仅在缺失时）
    - 为 `.gitscripts/random-branch.sh` 添加可执行权限
    - 执行 `git config --local --replace-all include.path <项目绝对路径>/.gitconfig`
  - 自动设置 commit subject
    - 覆盖更新 `.githooks/commit-msg`、`.githooks/pre-commit` 并设置为可执行
    - 自动补齐 `.commit-type.cjs`（若不存在）
    - 执行 `git config --local --replace-all core.hooksPath .githooks`
  - 自定义 git 命令
    - 向项目添加 `.gitattributes`（仅在缺失时）

### 使用方法

```bash
$ anl git
```

在提示中选择一个或多个功能。除 `.githooks` 下脚本会按最新版本覆盖更新外，其余文件仅在不存在时创建。

当检测到关键依赖缺失时，CLI 会给出一键修复提示：

- 选择 gitflow 且本机缺少 `jq`：提示安装 `jq`
- 选择 commitSubject 且缺少 `commitlint`/`lint-staged`：按项目锁文件给出 `pnpm`/`yarn`/`npm` 的安装命令

### `.commit-type.cjs` 与提交类型自定义

选择「自动设置 commit subject」后，会向项目复制 `.commit-type.cjs`（若不存在）。该文件定义 commit 时可选的**类型（subject 前缀）**，例如 `feat`、`fix`、`chore` 等，与 CommitLint 规范一致。

**文件结构示例：**

```javascript
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
	chore: {
		description: 'Daily work, miscellaneous',
		title: 'Chores',
		emoji: '💻',
		subject: 'chore',
	},
	// ... 其他类型
};

module.exports = { types };
```

**字段说明：**

| 字段          | 说明                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `description` | 该类型的简短描述，用于交互选择时的说明。                                             |
| `title`       | 该类型的展示标题。                                                                   |
| `emoji`       | 可选，与该类型关联的 emoji。                                                         |
| `subject`     | 实际写入 commit message 的前缀，需符合 CommitLint 配置（如 `feat`、`fix`、`docs`）。 |

可根据团队规范增删或修改 `types` 中的项；修改后，commit 时选择类型会使用新的列表。

### 注意事项

- 请在 Git 仓库内运行。
- 若自动执行的 git config 失败，请手动执行：

```bash
git config --local --replace-all include.path "$(pwd)/.gitconfig"
git config --local --replace-all core.hooksPath .githooks
```
