# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | 日本語


# 機能概要

> an-cli はフロントエンド開発用コマンドラインツールで、以下のコマンドを含みます：
>
> - `anl type` コマンド：Swagger JSON に基づいて TypeScript 型定義と API リクエスト関数を自動生成するコマンドラインツール。
> - `anl lint` コマンド：React または Vue プロジェクト用の eslint、stylelint、prettier、commitLint、VSCode 関連設定を生成
> - `anl git` コマンド：Git ローカル設定を生成し、オプション機能として gitflow 標準ブランチ作成、git commit メッセージテーマ、git カスタムコマンド設定を提供

# 機能特徴

- `anl type`
  - 🚀 Swagger JSON ドキュメントの自動解析
  - 📦 TypeScript 型定義ファイルの生成
  - 🔄 型安全な API リクエスト関数の生成
  - 🎯 パスパラメータ、クエリパラメータ、リクエストボディのサポート
  - 📝 列挙型定義の自動生成
  - 🎨 コードフォーマットのサポート
  - ⚡️ ファイルアップロードのサポート
  - 🛠 カスタマイズ可能なコード生成オプション
  - 🌐 複数の Swagger サーバー設定のサポート
  - 🔧 OPTIONS、HEAD、SEARCH などの HTTP メソッドのサポート

- `anl lint`
  - 🔍 各種 lint ツールのワンクリック設定
  - 🎨 ESLint 設定の自動化
  - 🎯 Prettier フォーマット設定
  - 🔄 CommitLint コミット規約
  - 📦 VSCode エディタ設定

- `anl git`
  - 🔍 複数の機能を選択してインストール
  - 🎨 標準的な git flow ブランチ作成
  - 🎯 CommitLint 規約に準拠したテーマの自動設定
  - 🔄 git カスタムコマンド設定とエントリーポイントの提供
  - 📦 ゼロ設定の自動生成

# インストール

> [!NOTE]
> グローバルインストールが必要です

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

# 使用方法

> [!TIP]
>
> 1. 初めて使用する場合、どのような結果になるか不明な場合は、まずコマンドを実行してプロジェクトにどのような変化が起こるかを観察し、その後ドキュメントと組み合わせて設定を修正し、再度生成して最終的に理想的な結果を得ることをお勧めします
> 2. または、以下の手順に従って一歩ずつ進めることで成果が得られます
> 3. プロジェクトのルートディレクトリで `anl type`、`anl lint`、`anl git` コマンドを実行してください

## `anl type` コマンド使用方法

- **初回**実行時、`anl type` コマンドは*プロジェクトルートディレクトリ*に `an.config.json` という名前の設定ファイルを*自動作成*します（手動作成も可能）。初期化設定テンプレートが含まれます。

- `anl type` コマンド実行時、ユーザーのプロジェクトルートディレクトリにある `an.config.json` 設定ファイルを検索し、その設定情報を読み取り、対応する axios ラッパー、設定、インターフェースリスト、インターフェースリクエスト、および各インターフェースリクエストのパラメータとレスポンスの TS 型を生成します

- 設定ファイル内の設定項目は自由に変更できます

- `an.config.json` 設定ファイルについて
  - 設定ファイルはプロジェクトルートディレクトリに配置する必要があります

  - 設定ファイル名は変更できません

  - 具体的なパラメータの説明は[設定ファイル詳細](#設定ファイル詳細)を参照してください

- 必要に応じて設定ファイルを更新し、再度 `anl type` コマンドを実行すると、設定ファイルで指定された設定情報に基づいて対応する型情報が生成されます

- 'config.ts'、'error-message.ts'、'fetch.ts'、'api-type.d.ts' これらのファイルが既に存在する場合は、再生成されません

-

> [!NOTE]
>
> これらの設定が不明な場合は、まず anl type コマンドを実行して型を生成し、プロジェクトディレクトリを確認し、設定項目の説明と組み合わせて設定項目を調整し、再度生成して設定項目の効果を段階的に検証し、最終的な設定を完成させることができます

### 使用方法

```bash
$ anl type
```

### 設定ファイル詳細

#### 設定ファイルの例

**単一 Swagger サーバー設定：**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"swaggerConfig": {
		"url": "https://generator3.swagger.io/openapi2.json",
		"apiListFileName": "index.ts",
		"publicPrefix": "api",
		"headers": {}
	},
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"headers": {},
	"includeInterface": [
		{
			"path": "/api/user",
			"method": "get"
		}
	],
	"excludeInterface": [
		{
			"path": "/api/admin",
			"method": "post"
		}
	],
	"parameterSeparator": "_",
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	}
}
```

**複数の Swagger サーバー設定：**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"parameterSeparator": "_",
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	},
	"swaggerConfig": [
		{
			"url": "https://generator3.swagger.io/openapi1.json",
			"apiListFileName": "op.ts",
			"headers": {}
		},
		{
			"url": "https://generator3.swagger.io/openapi2.json",
			"apiListFileName": "index.ts",
			"publicPrefix": "/api",
			"headers": {}
		}
	]
}
```

#### 設定項目の説明

| 設定項目                           | 型                                    | 必須   | 説明                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| saveTypeFolderPath                 | string                                | はい   | 型定義ファイルの保存パス                                                                                                                                                                                                                                                                                                                                                                                 |
| saveApiListFolderPath              | string                                | はい   | API リクエスト関数ファイルの保存パス                                                                                                                                                                                                                                                                                                                                                                     |
| saveEnumFolderPath                 | string                                | はい   | 列挙データファイルの保存パス                                                                                                                                                                                                                                                                                                                                                                             |
| importEnumPath                     | string                                | はい   | 列挙型インポートパス（apps/types/models/\*.ts で enum ファイルを参照するパス）                                                                                                                                                                                                                                                                                                                           |
| swaggerJsonUrl                     | string                                | いいえ | Swagger JSON ドキュメントのアドレス（`swaggerConfig` に移行済み、旧版設定との互換性のため保持）**今後のバージョンでこのフィールドは削除されます**                                                                                                                                                                                                                                                        |
| swaggerConfig                      | object \| Array<object>               | いいえ | Swagger サーバー設定。単一サーバーの場合は直接オブジェクトを記入、複数サーバーの場合は配列を使用。各サーバーで `url`、`publicPrefix`、`modulePrefix`、`apiListFileName`、`headers`、`dataLevel`、`parameterSeparator`、`includeInterface`、`excludeInterface` を設定可能<br />このフィールドは単一 Swagger サーバー設定と複数の Swagger サーバー設定の例に対応します。上にスクロールして確認してください |
| swaggerConfig[].url                | string                                | はい   | Swagger JSON ドキュメントのアドレス                                                                                                                                                                                                                                                                                                                                                                      |
| swaggerConfig[].publicPrefix       | string                                | いいえ | URL パス上の共通プレフィックス、例：api/users、api/users/{id}、api が共通プレフィックスです                                                                                                                                                                                                                                                                                                              |
| swaggerConfig[].apiListFileName    | string                                | いいえ | API リストファイル名、デフォルトは `index.ts`。複数サーバー使用時、各サーバーのファイル名は一意である必要があります                                                                                                                                                                                                                                                                                      |
| swaggerConfig[].headers            | object                                | いいえ | このサーバーのリクエストヘッダー設定                                                                                                                                                                                                                                                                                                                                                                     |
| swaggerConfig[].modulePrefix       | string                                | いいえ | リクエストパスのプレフィックス（モジュール名として理解できます）、各 API リクエストパスの前に自動的に追加されます。<br />例：`modulePrefix: "/forward"` の場合<br />`/publicPrefix/modulePrefix/user` は `/api/forward/user` になります                                                                                                                                                                  |
| swaggerConfig[].dataLevel          | 'data' \| 'serve' \| 'axios'          | いいえ | このサーバーのインターフェースレスポンスデータのレベル。設定されていない場合、グローバル `dataLevel` 設定を使用します                                                                                                                                                                                                                                                                                    |
| swaggerConfig[].parameterSeparator | '$' \| '\_'                           | いいえ | このサーバーの API 名と型名を生成する際に使用される区切り文字。設定されていない場合、グローバル `parameterSeparator` 設定を使用します                                                                                                                                                                                                                                                                    |
| swaggerConfig[].includeInterface   | Array<{path: string, method: string}> | いいえ | このサーバーに含めるインターフェースのリスト。設定されていない場合、グローバル `includeInterface` 設定を使用します                                                                                                                                                                                                                                                                                       |
| swaggerConfig[].excludeInterface   | Array<{path: string, method: string}> | いいえ | このサーバーから除外するインターフェースのリスト。設定されていない場合、グローバル `excludeInterface` 設定を使用します                                                                                                                                                                                                                                                                                   |
| requestMethodsImportPath           | string                                | はい   | リクエストメソッドのインポートパス                                                                                                                                                                                                                                                                                                                                                                       |
| dataLevel                          | 'data' \| 'serve' \| 'axios'          | いいえ | グローバルインターフェースレスポンスデータのレベル設定、デフォルト：`'serve'`。各サーバーで個別に上書き可能                                                                                                                                                                                                                                                                                              |
| formatting                         | object                                | いいえ | コードフォーマット設定                                                                                                                                                                                                                                                                                                                                                                                   |
| formatting.indentation             | string                                | いいえ | コードインデント文字、例：`"\t"` または `"  "` (2スペース)                                                                                                                                                                                                                                                                                                                                               |
| formatting.lineEnding              | string                                | いいえ | 改行、例：`"\n"` (LF) または `"\r\n"` (CRLF)                                                                                                                                                                                                                                                                                                                                                             |
| headers                            | object                                | いいえ | リクエストヘッダー設定（`swaggerConfig` に移行済み、旧版設定との互換性のため保持）                                                                                                                                                                                                                                                                                                                       |
| includeInterface                   | Array<{path: string, method: string}> | いいえ | グローバルに含めるインターフェース：`saveApiListFolderPath` で指定されたインターフェースリストファイルには、このリストに含まれるインターフェースのみが含まれます。`excludeInterface` フィールドと相互排他的です。各サーバーで個別に上書き可能                                                                                                                                                            |
| excludeInterface                   | Array<{path: string, method: string}> | いいえ | グローバルに除外するインターフェース：`saveApiListFolderPath` で指定されたインターフェースリストテキストには、このリストに含まれないインターフェースが含まれます。`includeInterface` と相互排他的です。各サーバーで個別に上書き可能                                                                                                                                                                      |
| publicPrefix                       | string                                | いいえ | グローバル URL パス上の共通プレフィックス（`swaggerConfig` に移行済み、旧版設定との互換性のため保持）                                                                                                                                                                                                                                                                                                    |
| modulePrefix                       | string                                | いいえ | グローバルリクエストパスのプレフィックス（各サーバーで個別に上書き可能）                                                                                                                                                                                                                                                                                                                                 |
| apiListFileName                    | string                                | いいえ | グローバル API リストファイル名、デフォルトは `index.ts`（`swaggerConfig` に移行済み、旧版設定との互換性のため保持）                                                                                                                                                                                                                                                                                     |
| enmuConfig                         | object                                | はい   | 列挙型設定オブジェクト                                                                                                                                                                                                                                                                                                                                                                                   |
| enmuConfig.erasableSyntaxOnly      | boolean                               | はい   | tsconfig.json の `compilerOptions.erasableSyntaxOnly` オプションと一致させます。`true` の場合、enum ではなく const オブジェクトを生成します（型のみの構文）。デフォルト値：`false`                                                                                                                                                                                                                       |
| enmuConfig.varnames                | string                                | いいえ | Swagger schema フィールド名でカスタム列挙メンバー名用。デフォルト値：`enum-varnames`。                                                                                                                                                                                                                                                                                                                   |
| enmuConfig.comment                 | string                                | いいえ | Swagger schema フィールド名で列挙メンバーの説明用（コメント生成に使用）。デフォルト値：`enum-descriptions`。                                                                                                                                                                                                                                                                                             |
| parameterSeparator                 | '$' \| '\_'                           | いいえ | グローバル API 名と型名を生成する際に、パスセグメントとパラメータの間に使用される区切り文字。例えば、`/users/{userId}/posts` に区切り文字 `'_'` を使用すると `users_userId_posts_GET` が生成されます。デフォルト値：`'_'`。各サーバーで個別に上書き可能                                                                                                                                                  |

#### 設定項目と生成ファイルの対応関係

> ファイル構造は設定ファイルに基づいて生成されます。**制御外** とマークされているものは、そのフォルダとファイルが自動生成され、設定項目で制御されないことを示します

```
project/
├── apps/
│   ├── types/               		# saveTypeFolderPath 設定項目で指定
│   │   ├── models/          				# すべての型定義ファイル（列挙型を除く）制御外
│   │   ├── connectors/      				# API 型定義（インターフェース定義ファイル）制御外
│   └── api/                 		# リクエストファイル：saveApiListFolderPath 設定項目で指定
│   │    └── index.ts        				# API リクエスト関数リスト（単一サーバーまたは最初のサーバー）制御外
│   │    └── op.ts           				# 複数サーバー時、他のサーバーの API リストファイル 制御外
│   │    └── api-type.d.ts      		# リクエスト型定義ファイル 制御外
│   │    └── config.ts       				# リクエスト、レスポンスインターセプター、リクエスト設定 制御外
│   │    └── error-message.ts   		# システムレベルのエラーメッセージ 制御外
│   │    ├── fetch.ts        				# axios リクエストラッパー、fetch に置き換え可能 制御外
│   └── enums/               		# 列挙型データ型定義：saveEnumFolderPath 設定項目で指定
```

### 生成されるコードの例

#### インターフェース型定義

```typescript
declare namespace UserDetail_GET {
	interface Query {
		userId: string;
	}

	interface Response {
		id: string;
		name: string;
		age: number;
		role: UserRole;
	}
}
```

#### API リクエスト関数

```typescript
import { GET } from './fetch';

/**
 * ユーザー詳細を取得
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

### 機能の説明

#### 設定の優先順位

ツールはグローバル設定とサーバーレベル設定をサポートし、以下の優先順位ルールに従います：

**優先順位：サーバーレベル設定 > グローバル設定 > デフォルト値**

以下の設定項目はサーバーレベルでグローバル設定を上書きすることをサポートしています：

- `dataLevel`: インターフェースレスポンスデータのレベル
- `parameterSeparator`: API 名と型名の区切り文字
- `includeInterface`: 含めるインターフェースのリスト
- `excludeInterface`: 除外するインターフェースのリスト
- `modulePrefix`: リクエストパスのプレフィックス
- `publicPrefix`: URL の共通プレフィックス
- `headers`: リクエストヘッダー設定

**例：**

```json
{
	"dataLevel": "serve",
	"parameterSeparator": "_",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data",
			"apiListFileName": "api1.ts"
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts"
		}
	]
}
```

上記の設定では：

- `api1.ts` は `dataLevel: "data"` を使用（サーバーレベル設定）
- `api2.ts` は `dataLevel: "serve"` を使用（グローバル設定）
- 両サーバーとも `parameterSeparator: "_"` を使用（グローバル設定）

#### 型解析

- すべての OpenAPI 3.0 仕様のデータ型をサポート
- 複雑なネストされた型の自動処理
- 配列、オブジェクト、列挙型などの型をサポート
- インターフェースコメントの自動生成

#### 列挙型生成

ツールは 2 つの列挙型生成モードをサポートしており、`enmuConfig.erasableSyntaxOnly` 設定で制御します：

**従来の列挙型モード** (`enmuConfig.erasableSyntaxOnly: false`、デフォルト値):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**定数オブジェクトモード** (`enmuConfig.erasableSyntaxOnly: true`):

```typescript
export const Status = {
	Success: 'Success',
	Error: 'Error',
	Pending: 'Pending',
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];
```

> **なぜ定数オブジェクトモードを使用するのか？**
> TypeScript の `compilerOptions.erasableSyntaxOnly` が `true` に設定されている場合、コードは削除可能な型構文のみを使用できます。従来の `enum` は実行時コードを生成しますが、定数オブジェクトは純粋な型であり、コンパイル後に完全に削除されます。これにより、型のみの構文を要求するビルドツールとの互換性が保証されます。

**型での使用：**

```typescript
// 従来の列挙型モード
interface User {
	status: Status; // 列挙型を直接型として使用
}

// 定数オブジェクトモード
interface User {
	status: StatusType; // 生成された 'Type' サフィックス付きの型を使用
}
```

#### データレベル設定（dataLevel）

`dataLevel` は、インターフェースレスポンスデータの抽出レベルを設定するために使用され、3つのオプションをサポートしています：

1. **`'serve'`（デフォルト）**：サーバーレスポンスから `data` フィールドを抽出

   ```typescript
   // サーバーが返す: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // 関数が返す: { id: 1, name: 'user' }
   ```

2. **`'data'`**：`data.data` フィールドを抽出（ネストされたデータのシナリオに適用）

   ```typescript
   // サーバーが返す: { data: { code: 200, data: { id: 1, name: 'user' } } }
   // 関数が返す: { id: 1, name: 'user' }
   ```

3. **`'axios'`**：完全な axios レスポンスオブジェクトを返す
   ```typescript
   // サーバーが返す: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // 関数が返す: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   ```

**設定例：**

```json
{
	"dataLevel": "serve",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data"
		}
	]
}
```

> **注意**：サーバーレベルの `dataLevel` 設定はグローバル設定を上書きします。

#### コードフォーマット

ツールはカスタムコードフォーマットオプションをサポートし、`formatting` 設定で制御します：

**設定例：**

```json
{
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	}
}
```

**設定説明：**

- `indentation`: コードインデント文字
  - `"\t"`: Tab インデントを使用（デフォルト）
  - `"  "`: 2 スペースのインデントを使用
  - `"    "`: 4 スペースのインデントを使用
- `lineEnding`: 改行タイプ
  - `"\n"`: LF（Linux/macOS スタイル、推奨）
  - `"\r\n"`: CRLF（Windows スタイル）

**注意：** プロジェクトに Prettier が設定されている場合、生成されたコードは自動的に Prettier でフォーマットされ、`formatting` 設定は Prettier によって上書きされる可能性があります。

#### ファイルアップロード

ファイルアップロード型が検出されると、対応するリクエストヘッダーが自動的に追加されます：

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### エラー処理

ツールには完全なエラー処理メカニズムが組み込まれています：

- 解析エラーの通知
- 型生成失敗の警告
- ファイル書き込み例外処理

#### インターフェースフィルタリング

ツールは、生成するインターフェースを設定でフィルタリングすることをサポートしています：

1. 特定のインターフェースを含める
   - `includeInterface` 設定項目で生成するインターフェースを指定
   - 設定で指定されたインターフェースのみが生成されます
   - 設定形式は `path` と `method` を含むオブジェクト配列です

2. 特定のインターフェースを除外
   - `excludeInterface` 設定項目で除外するインターフェースを指定
   - 設定で指定されたインターフェース以外のすべてのインターフェースが生成されます
   - 設定形式は `path` と `method` を含むオブジェクト配列です

設定例：この設定は `an.config.json` で行います

```json
{
	"includeInterface": [
		{
			"path": "/api/user",
			"method": "get"
		}
	],
	"excludeInterface": [
		{
			"path": "/api/admin",
			"method": "post"
		}
	]
}
```

注意：`includeInterface` と `excludeInterface` は同時に使用できません。両方を設定した場合は、`includeInterface` が優先されます。

#### 複数の Swagger サーバーサポート

ツールは複数の Swagger サーバーの設定をサポートしており、各サーバーは独立して設定できます：

- **単一サーバー**：`swaggerConfig` は直接オブジェクトとして記入可能
- **複数サーバー**：`swaggerConfig` は配列形式を使用し、各サーバーは一意の `apiListFileName` を設定する必要があります

**動作原理：**

- 最初のサーバーの API は指定された `apiListFileName`（デフォルトは `index.ts`）に生成されます
- 後続のサーバーの API はそれぞれの `apiListFileName` ファイルに追加されます
- 型定義と列挙型は統一されたフォルダにマージされ、重複を避けます

**サーバーレベル設定：**

各サーバーは以下のオプションを独立して設定することをサポートしています。設定されていない場合、グローバル設定が使用されます：

- `dataLevel` - インターフェースレスポンスデータのレベル
- `parameterSeparator` - API 名と型名の区切り文字
- `includeInterface` - 含めるインターフェースのリスト
- `excludeInterface` - 除外するインターフェースのリスト
- `modulePrefix` - リクエストパスのプレフィックス

#### パスプレフィックス（modulePrefix）

`modulePrefix` はすべての API リクエストパスの前にプレフィックスを自動的に追加するために使用され、以下のシナリオで特に役立ちます：

1. **リバースプロキシシナリオ**：バックエンドサービスがリバースプロキシ経由で転送される場合
2. **API ゲートウェイ**：パスに統一的にゲートウェイプレフィックスを追加
3. **マルチ環境設定**：異なる環境で異なるパスプレフィックスを使用

**使用例：**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api.example.com/swagger.json",
			"modulePrefix": "/forward",
			"apiListFileName": "api.ts"
		}
	]
}
```

**効果：**

Swagger で定義されたパス `/api/user/list` は次のように生成されます：

```typescript
export const apiUserListGet = (params: ApiUserList_GET.Query) => GET<ApiUserList_GET.Response>('/forward/api/user/list', params);
```

**publicPrefix との違い：**

- `publicPrefix`: インターフェースパスからプレフィックスを削除し、生成される関数名にのみ影響します
- `modulePrefix`: 実際のリクエストパスの前にプレフィックスを追加し、実行時のリクエスト URL に影響します

**設定例：**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"apiListFileName": "api1.ts",
			"publicPrefix": "/api/v1",
			"modulePrefix": "/forward",
			"dataLevel": "serve",
			"parameterSeparator": "_",
			"headers": {
				"Authorization": "Bearer token1"
			},
			"includeInterface": [
				{
					"path": "/api/v1/users",
					"method": "get"
				}
			]
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts",
			"publicPrefix": "/api/v2",
			"dataLevel": "data",
			"headers": {
				"Authorization": "Bearer token2"
			}
		}
	]
}
```

**移行説明：**

- 旧版設定（`swaggerJsonUrl`、`publicPrefix`、`headers`）は引き続き互換性があります
- ツールは自動的に旧版設定を検出し、移行方法を提示します
- より柔軟性を得るために、新しい `swaggerConfig` 設定への移行をお勧めします

#### HTTP メソッドサポート

ツールは以下の HTTP メソッドをサポートしています：

- `GET` - リソースの取得
- `POST` - リソースの作成
- `PUT` - リソースの更新（完全置換）
- `PATCH` - リソースの更新（部分更新）
- `DELETE` - リソースの削除
- `OPTIONS` - プリフライトリクエスト
- `HEAD` - レスポンスヘッダーの取得
- `SEARCH` - 検索リクエスト

すべてのメソッドは型安全なパラメータとレスポンス型定義をサポートしています。

### 注意事項

1. Swagger JSON ドキュメントのアドレスにアクセスできることを確認してください
2. 設定ファイル内のパスは、プロジェクトルートディレクトリからの相対パスである必要があります
3. 生成されたファイルは、既存の同名ファイルを上書きします（ただし、`config.ts`、`error-message.ts`、`fetch.ts`、`api-type.d.ts` は既に存在する場合は上書きされません）
4. 生成されたファイルをバージョン管理に含めることをお勧めします
5. 複数の Swagger サーバーを使用する場合、各サーバーの `apiListFileName` が一意であることを確認し、ファイルの上書きを避けてください
6. 複数のサーバー設定を使用する場合、型定義と列挙型はマージされます。異なるサーバーに同じ名前の型がある場合、競合が発生する可能性があります
7. サーバーレベルの設定（`dataLevel`、`parameterSeparator`、`includeInterface`、`excludeInterface`、`modulePrefix`）はグローバル設定を上書きします
8. `includeInterface` と `excludeInterface` は同時に設定できません。両方が設定された場合、`includeInterface` が優先されます

### よくある質問

1. **生成された型ファイルのフォーマットが失敗する**
   - prettier がインストールされているか確認してください
   - プロジェクトルートディレクトリに prettier 設定ファイルがあるか確認してください
   - `formatting` 設定が正しいか確認してください

2. **リクエスト関数のインポートパスエラー**
   - `requestMethodsImportPath` 設定が正しいか確認してください
   - リクエストメソッドファイルが存在するか確認してください

3. **いつ `modulePrefix` を使用しますか？**
   - API がリバースプロキシまたはゲートウェイ経由でアクセスされる必要がある場合
   - 例：Swagger では `/api/user` と定義されていますが、実際のリクエストは `/gateway/api/user` である必要があります
   - `modulePrefix: "/gateway"` を設定することで実現できます

4. **`publicPrefix` と `modulePrefix` の違いは何ですか？**
   - `publicPrefix`: インターフェースパスからプレフィックスを削除し、生成される関数名にのみ影響します
     - 例：`/api/user/list` から `/api` を削除すると、関数名は `userListGet` になります
   - `modulePrefix`: リクエストパスの前にプレフィックスを追加し、実際のリクエスト URL に影響します
     - 例：`/api/user/list` に `/forward` を追加すると、リクエスト URL は `/forward/api/user/list` になります

5. **複数のサーバーで異なる `dataLevel` を設定するには？**

   ```json
   {
   	"dataLevel": "serve",
   	"swaggerConfig": [
   		{
   			"url": "http://old-api.com/swagger.json",
   			"dataLevel": "axios",
   			"apiListFileName": "old-api.ts"
   		},
   		{
   			"url": "http://new-api.com/swagger.json",
   			"apiListFileName": "new-api.ts"
   		}
   	]
   }
   ```

   - `old-api.ts` は `dataLevel: "axios"` を使用
   - `new-api.ts` はグローバルの `dataLevel: "serve"` を使用

6. **特定のインターフェースのみを生成するには？**
   - `includeInterface` 設定を使用：
     ```json
     {
     	"swaggerConfig": [
     		{
     			"url": "http://api.com/swagger.json",
     			"includeInterface": [
     				{ "path": "/api/user", "method": "get" },
     				{ "path": "/api/user/{id}", "method": "post" }
     			]
     		}
     	]
     }
     ```
   - または `excludeInterface` を使用して不要なインターフェースを除外

7. **生成されたファイルが上書きされた場合はどうすればよいですか？**
   - `config.ts`、`error-message.ts`、`fetch.ts`、`api-type.d.ts` などのファイルは、存在しない場合にのみ生成されます
   - API リストファイルと型ファイルは毎回再生成されます
   - 生成されたファイルをバージョン管理に追加して、変更を追跡しやすくすることをお勧めします

# `anl lint` コマンド使用方法

> フロントエンドプロジェクトの各種 lint ツールをワンクリックで設定する機能を提供します：
>
> - ESLint コードチェック
> - Prettier コードフォーマット
> - CommitLint コミットメッセージ規約
> - VSCode エディタ設定

### 使用方法

```bash
$ anl lint
```

コマンドを実行すると、インタラクティブな複数選択インターフェースが表示され、インストールするツールを選択できます：

```
? Select the linting tools to install (multi-select):
❯◯ ESLint - JavaScript/TypeScript linter
 ◯ Stylelint - CSS/SCSS/Less linter
 ◯ Commitlint - Git commit message linter
 ◯ Prettier - Code formatter
 ◯ VSCode - Editor settings
```

**スペースキー**で選択/選択解除、**Enter**で確認します。

### 設定の詳細

#### 1. ESLint 設定

- 必要な依存関係を自動インストール
- React/Vue フレームワークをサポート（選択時にフレームワークの選択を求められます）
- `.eslintrc.js` と `.eslintignore` を自動生成
- TypeScript サポートを統合

#### 2. Stylelint 設定

- stylelint 関連の依存関係を自動インストール
- Less/Sass プリプロセッサをサポート（選択時にプリプロセッサの選択を求められます）
- `.stylelintrc.js` 設定ファイルを生成
- Prettier サポートを統合

#### 3. Prettier 設定

- prettier 関連の依存関係を自動インストール
- `.prettierrc.js` 設定ファイルを生成
- デフォルト設定には以下が含まれます：
  - 行幅：80
  - Tab インデント
  - シングルクォートを使用
  - アロー関数の括弧
  - その他のコードスタイル規約

#### 4. CommitLint 設定

- commitlint 関連の依存関係をインストール
- husky git hooks を設定
- `commitlint.config.js` を生成
- git commit メッセージを標準化

#### 5. VSCode 設定

- `.vscode/settings.json` を作成
- エディタの自動フォーマットを設定
- デフォルトのフォーマットツールを設定
- 既存の設定ファイルの更新をサポート

### 使用例

1. **ESLint と Prettier のみをインストール**
   - ESLint と Prettier を選択
   - ESLint を選択した場合、フレームワーク（React/Vue）の選択を求められます
   - インストール後、プロジェクトに `.eslintrc.js` と `.prettierrc.js` が作成されます

2. **完全な設定**
   - すべてのオプションを選択
   - フレームワークとプリプロセッサの選択を完了
   - プロジェクトに完全なコード規約システムが設定されます

# `anl git` コマンド

### 機能概要

- インタラクティブな複数選択により、現在のリポジトリに以下の Git 機能を適用します：
  - gitflow 標準ブランチ作成
    - `.gitscripts/`、`.gitconfig`、`.commit-type.cjs` をプロジェクトにコピー（存在しない場合のみ）
    - `.gitscripts/random-branch.sh` に実行権限を追加
    - `git config --local include.path ../.gitconfig` を実行
  - commit subject の自動設定
    - `.githooks/commit-msg` をコピーして実行可能に設定
    - `git config core.hooksPath .githooks` を実行
  - カスタム git コマンド
    - プロジェクトに `.gitattributes` を追加（存在しない場合のみ）

### 使用方法

```bash
$ anl git
```

プロンプトで 1 つ以上の機能を選択してください。ファイルは存在しない場合にのみ作成されます。既存のファイルは保持されます。

### 注意事項

- Git リポジトリ内で実行してください。
- 自動実行される git config が失敗した場合は、手動で実行してください：

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# ライセンス

ISC License

# 貢献ガイド

[Issue](https://github.com/bianliuzhu/an-cli/issues) や [Pull Request](https://github.com/bianliuzhu/an-cli/pulls) の提出を歓迎します！
