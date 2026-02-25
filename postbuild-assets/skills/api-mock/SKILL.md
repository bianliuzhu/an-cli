# Mock 数据生成

> 根据 API 定义和关联类型，生成符合 MockJS 语法的 mock 数据文件

## 项目配置

- API 文件目录: `{{API_DIR}}`
- API 文件: `{{API_FILES}}`
- 类型定义目录: `{{TYPES_DIR}}`
- Mock 输出目录: `{{MOCK_OUTPUT}}`
- Swagger 源:
  - {{SWAGGER_URLS}}

---

## 触发条件

当用户需要为 API 生成 mock 数据时使用本 Skill。可为指定接口或所有接口生成。

---

## 执行步骤

### 第 1 步：读取 API 定义

从 `{{API_DIR}}` 下的 API 文件（`{{API_FILES}}`）中解析所有导出的 API 函数。

每个函数的格式为：

```typescript
export const functionName_METHOD = (params) => METHOD<ResponseType>(`/url/path`, ...);
```

提取以下信息：

- **函数名**（如 `opTradeOrderQuerypage_POST`）
- **HTTP 方法**（函数名后缀 `_GET` / `_POST` / `_PUT` / `_DELETE`）
- **URL 路径**（模板字符串中的路径，如 `/forward/op/trade/order/queryPage`）
- **响应类型命名空间**（泛型参数，如 `OpTradeOrderQuerypage_POST.Response`）

### 第 2 步：解析响应类型链

1. 从 `{{TYPES_DIR}}/connectors/` 找到对应的类型声明文件，格式为：

```typescript
declare namespace OpTradeOrderQuerypage_POST {
	type Body = import('../models/xxx').XxxDTO;
	type Response = import('../models/yyy').YyyVO;
}
```

2. 追踪 `Response` 类型到 `{{TYPES_DIR}}/models/` 下的实际接口定义
3. 递归解析所有嵌套的引用类型，直到获取完整的字段结构

### 第 3 步：生成 Mock 数据文件

为每个 API 生成独立的 `.json` 文件，放入 `{{MOCK_OUTPUT}}` 目录。

**文件命名规则**：

- 使用 URL 路径最后两段，用 `-` 连接，转为 kebab-case
- 示例：`/forward/op/trade/order/queryPage` -> `order-query-page.json`
- 示例：`/forward/op/trade/refund_order/queryPage` -> `refund-order-query-page.json`
- 示例：`/portal/common` -> `portal-common.json`

**文件格式**：

```json
/**
* @url /api{urlPath}
* @method {METHOD}
*/
{
    "success": true,
    "code": 0,
    "message": "success",
    "data": { ... }
}
```

注意事项：

- `@url` 路径统一加 `/api` 前缀
- `@method` 为大写 HTTP 方法（GET / POST / PUT / DELETE）
- 外层响应结构固定为 `{ success, code, message, data }`，mock 内容填充在 `data` 字段中
- 使用 tab 缩进

### 第 4 步：应用 MockJS 语法

根据响应类型的字段结构，使用 MockJS 语法生成逼真数据：

**分页列表接口**（Response 中包含 `records` 数组 + `total` / `size` / `current` / `pages`）：

```json
{
	"data": {
		"records|20": [
			{
				"id": 1,
				"fieldName": "示例值"
			}
		],
		"total": 100,
		"size": 10,
		"current": 1,
		"pages": 10
	}
}
```

使用 `"records|N"` 语法自动生成 N 条记录。

**字段值生成规则**：

| 字段名模式                                    | 类型          | 生成策略                             | 示例值                                        |
| --------------------------------------------- | ------------- | ------------------------------------ | --------------------------------------------- |
| `*id`, `*Id`                                  | number/string | 递增 ID 或 UUID                      | `1`, `"uuid-xxx"`                             |
| `*No`, `*no`                                  | string        | 业务编号                             | `"TP20260115112050937"`                       |
| `*name`, `*Name`                              | string        | 中文名或业务名称                     | `"示例名称"`                                  |
| `*phone`, `*Phone`                            | string        | 手机号                               | `"13401050329"`                               |
| `*email`, `*Email`                            | string        | 邮箱                                 | `"user@example.com"`                          |
| `*price`, `*Price`, `*amount`, `*Amount`      | number        | 金额                                 | `99.00`                                       |
| `*time`, `*Time`, `*At`                       | number/string | 时间戳(ms)或 ISO 日期                | `1768373346000`, `"2026-01-15T10:30:00.000Z"` |
| `*status`, `*Status`                          | string        | 枚举值（从类型定义中推断）           | `"REFUNDED"`                                  |
| `*Desc`                                       | string        | 状态描述                             | `"已退款"`                                    |
| `*url`, `*Url`, `*image`, `*Image`, `*avatar` | string        | URL                                  | `"https://example.com/image.png"`             |
| `*List` (数组)                                | array         | 枚举列表（`code` + `desc` 对象数组） | 见下方                                        |
| boolean 类型                                  | boolean       | true/false                           | `true`                                        |
| 其他 string                                   | string        | 有意义的占位文字                     | `"示例文本"`                                  |
| 其他 number                                   | number        | 合理数值                             | `10`                                          |
| nullable 字段                                 | null          | `null`                               | `null`                                        |

**枚举列表字段**（字段名以 `List` 结尾且为对象数组）：

```json
{
	"orderStatusList": [
		{ "code": "CREATED", "desc": "已创建" },
		{ "code": "COMPLETE", "desc": "已完成" }
	]
}
```

### 第 5 步：参考已有 Mock 文件

生成前先检查 `{{MOCK_OUTPUT}}` 目录中是否已有同名文件。如果存在：

- 保留已有文件的数据内容作为参考
- 询问用户是否覆盖
- 对于已有文件，优先复用其中的真实业务数据

---

## 输出摘要

生成完成后输出摘要：

```
Mock 数据生成完成：

  新增:
  - mocks/order-query-page.json  (POST /api/forward/op/trade/order/queryPage)
  - mocks/refund-order.json      (POST /api/forward/op/trade/refund_order/queryPage)

  跳过（已存在）:
  - mocks/login.json

  共生成 N 个文件，跳过 M 个文件
```

---

## 注意事项

- Mock 文件使用 JSON 格式，但文件头部的 `/** ... */` 注释不是标准 JSON，这是项目约定（配合 mock 中间件匹配路由）
- 字段值应尽量贴近真实业务数据，而非随机字符串
- 对于嵌套对象（如 `qrcode: { ios: { url, title }, android: { url, title } }`），需递归生成完整结构
- 对于类型中标注为 `@format int64` 的数值字段，生成合理范围内的整数
- 如果某些字段的类型是联合类型或枚举，从可能的值中选择一个合理的
