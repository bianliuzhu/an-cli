# `anl skill` 命令使用说明

### 功能概述

`anl skill` 是一个 Agent Skill 初始化工具，用于在项目中生成 AI 辅助开发的 Skill 文件。

目前支持两个 Skill：

| Skill          | 说明                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| **api-report** | API 变更检测报告 — 对比 API 文件的 git 变更，分析类型变化和影响范围，生成结构化报告 |
| **api-mock**   | Mock 数据生成 — 根据 API 定义和关联类型，生成符合 MockJS 语法的 mock 数据文件       |

### 前置条件

- 项目根目录下必须存在 `an.config.json` 配置文件
- `an.config.json` 中需要配置 `swaggerConfig`（包含 `apiListFileName`、`url` 等字段）
- 建议先执行 `anl type` 生成 API 文件和类型定义后，再使用 `anl skill`

### 使用方法

```bash
$ anl skill
```

### 交互流程

```
🛡️  an skill - Agent Skill 初始化工具

? 选择要初始化的 Skill（可多选）：
  [x] api-report  - API 变更检测报告
  [x] api-mock    - Mock 数据生成

? Skill 输出目标：
  ❯ .cursor/skills    (Cursor Skill)
    .claude/commands  (Claude Code /command)
    自定义路径...

📋 已从 an.config.json 读取配置：
  - API 目录: src/api
  - API 文件: op.ts, index.ts
  - 类型目录: src/types
  - 输出目录: .cursor/skills  (Skill 模式)

? 需要扫描 API 使用的目录（逗号分隔，支持 glob）： src/pages/**,src/components/**
? Mock 数据输出目录： mocks/

🥂 Skill 文件已写入: .cursor/skills/api-report/SKILL.md
🥂 Skill 文件已写入: .cursor/skills/api-mock/SKILL.md

✅ Skill 初始化完成！
```

### 交互选项说明

#### 1. 选择 Skill

支持多选。使用空格键选中/取消，回车键确认。至少需要选择一个 Skill。

#### 2. 选择输出目标

根据你使用的 AI 工具选择对应的输出格式：

| 选项               | 输出路径                         | 文件结构         | 适用工具    |
| ------------------ | -------------------------------- | ---------------- | ----------- |
| `.cursor/skills`   | `.cursor/skills/<name>/SKILL.md` | 目录 + SKILL.md  | Cursor      |
| `.claude/commands` | `.claude/commands/<name>.md`     | 单文件           | Claude Code |
| 自定义路径         | 用户指定                         | 可选上述两种结构 | 其他        |

#### 3. api-report 配置

| 提示                    | 默认值                           | 说明                                                              |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------- |
| 需要扫描 API 使用的目录 | `src/pages/**,src/components/**` | 逗号分隔，支持 glob 模式。用于检测变更 API 在哪些业务文件中被引用 |

#### 4. api-mock 配置

| 提示              | 默认值   | 说明                          |
| ----------------- | -------- | ----------------------------- |
| Mock 数据输出目录 | `mocks/` | 生成的 mock JSON 文件存放目录 |

### 自动读取的配置

命令会自动从项目的 `an.config.json` 中读取以下配置，无需手动输入：

| 配置项         | 来源字段                          | 说明                      |
| -------------- | --------------------------------- | ------------------------- |
| API 文件目录   | `saveApiListFolderPath`           | 如 `src/api`              |
| 类型文件目录   | `saveTypeFolderPath`              | 如 `src/types`            |
| API 文件名列表 | `swaggerConfig[].apiListFileName` | 如 `op.ts`, `index.ts`    |
| Swagger 源地址 | `swaggerConfig[].url`             | 写入 Skill 模板供 AI 参考 |

### 在不同工具中使用

#### Cursor 中使用

Skill 文件生成到 `.cursor/skills/` 后，Cursor 的 AI 会自动识别并在合适的场景下使用。

使用方式：在 Cursor 聊天中自然语言描述需求即可，例如：

- **API 变更检测**：`"检测一下 API 变更，生成变更报告"` 或 `"分析 src/api 下文件的变更影响"`
- **Mock 数据生成**：`"为所有接口生成 mock 数据"` 或 `"为 opTradeOrderQuerypage_POST 接口生成 mock"`

#### Claude Code 中使用

Skill 文件生成到 `.claude/commands/` 后，可通过斜杠命令调用：

```bash
/api-report    # 执行 API 变更检测
/api-mock      # 执行 Mock 数据生成
```

### Skill 详细说明

#### api-report — API 变更检测报告

**工作原理：**

1. 通过 `git diff` 对比 API 文件（如 `op.ts`、`index.ts`）与历史版本的差异
2. 解析变更的 API 端点（基于 `export const xxx_GET/POST` 命名模式）
3. 检测 `types/connectors/` 下的请求/响应类型变化
4. 检测 `types/models/` 下的共享模型变化
5. 扫描指定目录中对变更 API 的引用
6. 输出结构化报告，包含 Breaking Changes / Warnings / Compatible Changes 分类

**检测的变更类型：**

| 变更类型      | 严重程度   | 说明                        |
| ------------- | ---------- | --------------------------- |
| 删除端点      | Breaking   | `export const xxx` 行被删除 |
| 路径变更      | Breaking   | 同名函数的 URL 路径发生变化 |
| 参数变更      | Breaking   | 函数签名参数类型发生变化    |
| HTTP 方法变更 | Breaking   | GET/POST/PUT/DELETE 变化    |
| 响应类型变更  | Warning    | 泛型 `<ResponseType>` 变化  |
| 新增端点      | Compatible | 新增 `export const xxx`     |

#### api-mock — Mock 数据生成

**工作原理：**

1. 从 API 文件中解析所有导出的 API 函数，提取函数名、HTTP 方法、URL 路径、响应类型
2. 追踪 `types/connectors/` 中的 Response 类型到 `types/models/` 下的实际接口定义
3. 递归解析嵌套的引用类型，获取完整字段结构
4. 根据字段名和类型智能生成 mock 数据
5. 输出为项目约定的 mock JSON 文件格式

**生成的 mock 文件格式：**

```json
/**
 * @url /api/forward/op/trade/order/queryPage
 * @method POST
 */
{
	"success": true,
	"code": 0,
	"message": "success",
	"data": {
		"records|20": [
			{
				"id": 1,
				"orderNo": "TP20260115112050937",
				"phone": "13401050329",
				"orderStatus": "COMPLETE"
			}
		],
		"total": 100,
		"size": 10,
		"current": 1,
		"pages": 10
	}
}
```

**特性：**

- 文件头部 `@url` + `@method` 注释，配合 mock 中间件匹配路由
- 外层统一 `{ success, code, message, data }` 响应结构
- 分页列表使用 MockJS 语法（如 `"records|20": [...]`）
- 根据字段名智能推断数据内容（手机号、时间戳、金额、枚举值等）
- 生成前检查已有 mock 文件，避免覆盖

### 生成的文件

根据选择的输出目标，文件结构如下：

**Cursor 模式：**

```
project/
├── .cursor/
│   └── skills/
│       ├── api-report/
│       │   └── SKILL.md          # API 变更检测报告 Skill
│       └── api-mock/
│           └── SKILL.md          # Mock 数据生成 Skill
```

**Claude Code 模式：**

```
project/
├── .claude/
│   └── commands/
│       ├── api-report.md         # /api-report 命令
│       └── api-mock.md           # /api-mock 命令
```

### 注意事项

1. Skill 文件中的配置（API 路径、类型路径等）来自 `an.config.json`，如果配置变更后需重新执行 `anl skill` 更新
2. 重新执行 `anl skill` 会覆盖已有的 Skill 文件
3. 建议将生成的 Skill 文件加入版本控制，方便团队共享
4. api-report Skill 依赖 git 历史，首次生成 API 时无可对比版本，仅列出当前端点
5. api-mock 生成的文件使用 JSON 格式，但头部的 `/** ... */` 注释是项目约定（非标准 JSON）
