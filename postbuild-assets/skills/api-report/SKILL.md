# API 变更检测报告

> 检测 API 文件变更，分析影响范围，生成结构化报告

## 项目配置

- API 文件目录: `{{API_DIR}}`
- API 文件: `{{API_FILES}}`
- 类型定义目录: `{{TYPES_DIR}}`
- 扫描 API 使用的目录: `{{SCAN_DIRS}}`
- Swagger 源:
  - {{SWAGGER_URLS}}

---

## 触发条件

当用户执行 `anl type` 重新生成 API 后，使用本 Skill 检测变更。

---

## 执行步骤

### 第 1 步：获取 API 变更差异

对比 `{{API_DIR}}` 下的 API 文件（`{{API_FILES}}`）与 git 历史版本的差异：

```bash
git diff HEAD -- {{API_DIR}}/
```

如果文件尚未提交，使用工作区 diff：

```bash
git diff -- {{API_DIR}}/
```

### 第 2 步：解析变更的 API 端点

API 文件中每个导出函数对应一个 API 端点，格式为：

```typescript
export const functionName_METHOD = (params) => METHOD<ResponseType>(`/path/to/endpoint`, ...);
```

示例：

```typescript
export const opTradeOrderQuerypage_POST = (body: OpTradeOrderQuerypage_POST.Body, params?: IRequestFnParams) =>
	POST<OpTradeOrderQuerypage_POST.Response>(`/forward/op/trade/order/queryPage`, { ...params, body }, 'serve');
```

从 diff 中识别以下变更类型：

| 变更类型      | 判定标准                    | 严重程度   |
| ------------- | --------------------------- | ---------- |
| 删除端点      | `export const xxx` 行被删除 | Breaking   |
| 新增端点      | `export const xxx` 行被新增 | Compatible |
| 路径变更      | 同名函数的 URL 路径发生变化 | Breaking   |
| 参数变更      | 函数签名参数类型发生变化    | Breaking   |
| 响应类型变更  | 泛型 `<ResponseType>` 变化  | Warning    |
| HTTP 方法变更 | GET/POST/PUT/DELETE 变化    | Breaking   |

### 第 3 步：检测类型定义变更

对比 `{{TYPES_DIR}}/connectors/` 目录下的类型声明文件变更：

```bash
git diff HEAD -- {{TYPES_DIR}}/connectors/
```

每个 connector 文件（如 `op-trade-order-querypage-post.d.ts`）定义了对应 API 的请求体（`Body`）、查询参数（`Query`）、路径参数（`Path`）和响应（`Response`）类型。

同时检查 `{{TYPES_DIR}}/models/` 下的共享模型变更：

```bash
git diff HEAD -- {{TYPES_DIR}}/models/
```

关注以下变化：

- 字段新增/删除
- 字段类型变更（如 `number` -> `string`）
- 必填/可选变更
- 枚举值变更

### 第 4 步：扫描影响范围

在 `{{SCAN_DIRS}}` 目录中搜索对变更 API 的引用：

```bash
# 按导出函数名搜索（如 opTradeOrderQuerypage_POST）
rg "functionName" {{SCAN_DIRS}}
```

同时搜索变更类型的引用：

```bash
# 搜索 connector 命名空间引用（如 OpTradeOrderQuerypage_POST.Response）
rg "TypeNamespace" {{SCAN_DIRS}}
```

### 第 5 步：生成报告

输出格式如下：

```markdown
## API 变更检测报告

生成时间: YYYY-MM-DD HH:mm
对比基准: git HEAD

---

### 🔴 Breaking Changes (N)

#### 删除端点

| 函数名  | 路径  | 方法 | 所在文件 |
| ------- | ----- | ---- | -------- |
| xxx_GET | /path | GET  | op.ts    |

#### 参数/类型变更

| 函数名   | 变更说明                            | 所在文件 |
| -------- | ----------------------------------- | -------- |
| xxx_POST | Body 新增必填字段 `fieldName: Type` | index.ts |

### 🟡 Warnings (N)

| 函数名   | 变更说明                          | 所在文件 |
| -------- | --------------------------------- | -------- |
| xxx_POST | Response 字段 `data.xxx` 类型变更 | op.ts    |

### 🟢 Compatible Changes (N)

| 函数名  | 变更说明 | 所在文件 |
| ------- | -------- | -------- |
| xxx_GET | 新增端点 | index.ts |

---

### 📁 受影响文件 (N)

| 文件路径                | 引用的变更 API                      | 风险等级 |
| ----------------------- | ----------------------------------- | -------- |
| src/pages/xxx/index.tsx | opTradeOrderQuerypage_POST          | 高       |
| src/components/xxx.tsx  | OpTradeOrderQuerypage_POST.Response | 中       |

---

### 📋 建议操作

1. [ ] 检查文件 xxx 中对已删除端点的引用
2. [ ] 更新文件 xxx 中的类型引用
3. ...
```

---

## 注意事项

- 如果 git 中没有可对比的历史版本（首次生成），则跳过 diff，仅列出当前所有 API 端点
- 类型文件使用 `.d.ts` 后缀，是声明文件
- connectors 下的类型以命名空间形式组织（如 `OpTradeOrderQuerypage_POST.Body`）
- models 下的类型是共享数据模型，可能被多个 connector 引用
