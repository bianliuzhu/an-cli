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

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"swaggerJsonUrl": "https://generator3.swagger.io/openapi.json",
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
	]
}
```

#### 設定項目の説明

| 設定項目                 | 型                                    | 必須   | 説明                                                                                                                                                                                                |
| ------------------------ | ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| saveTypeFolderPath       | string                                | はい   | 型定義ファイルの保存パス                                                                                                                                                                            |
| saveApiListFolderPath    | string                                | はい   | API リクエスト関数ファイルの保存パス                                                                                                                                                                |
| saveEnumFolderPath       | string                                | はい   | 列挙データファイルの保存パス                                                                                                                                                                        |
| importEnumPath           | string                                | はい   | 列挙型インポートパス（apps/types/models/\*.ts で enum ファイルを参照するパス）                                                                                                                      |
| swaggerJsonUrl           | string                                | はい   | Swagger JSON ドキュメントのアドレス                                                                                                                                                                 |
| requestMethodsImportPath | string                                | はい   | リクエストメソッドのインポートパス                                                                                                                                                                  |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | はい   | インターフェースレスポンスデータのレベル                                                                                                                                                            |
| formatting               | object                                | いいえ | コードフォーマット設定                                                                                                                                                                              |
| headers                  | object                                | いいえ | リクエストヘッダー設定                                                                                                                                                                              |
| includeInterface         | Array<{path: string, method: string}> | いいえ | 含めるインターフェース：`saveApiListFolderPath` で指定されたインターフェースリストファイルには、このリストに含まれるインターフェースのみが含まれます。`excludeInterface` フィールドと相互排他的です |
| excludeInterface         | Array<{path: string, method: string}> | いいえ | 除外するインターフェース：`saveApiListFolderPath` で指定されたインターフェースリストテキストには、このリストに含まれないインターフェースが含まれます。`includeInterface` と相互排他的です           |
| publicPrefix             | string                                | いいえ | URL パス上の共通プレフィックス、例：api/users、api/users/{id}、api が共通プレフィックスです                                                                                                         |

#### 設定項目と生成ファイルの対応関係

> ファイル構造は設定ファイルに基づいて生成されます。**制御外** とマークされているものは、そのフォルダとファイルが自動生成され、設定項目で制御されないことを示します

```
project/
├── apps/
│   ├── types/               		# saveTypeFolderPath 設定項目で指定
│   │   ├── models/          				# すべての型定義ファイル（列挙型を除く）制御外
│   │   ├── connectors/      				# API 型定義（インターフェース定義ファイル）制御外
│   └── api/                 		# リクエストファイル：saveApiListFolderPath 設定項目で指定
│   │    ├── fetch.ts        				# リクエストメソッド実装 制御外
│   │    └── index.ts        				# API リクエスト関数リスト 制御外
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

#### 型解析

- すべての OpenAPI 3.0 仕様のデータ型をサポート
- 複雑なネストされた型の自動処理
- 配列、オブジェクト、列挙型などの型をサポート
- インターフェースコメントの自動生成

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

### 注意事項

1. Swagger JSON ドキュメントのアドレスにアクセスできることを確認してください
2. 設定ファイル内のパスは、プロジェクトルートディレクトリからの相対パスである必要があります
3. 生成されたファイルは、既存の同名ファイルを上書きします
4. 生成されたファイルをバージョン管理に含めることをお勧めします

### よくある質問

1. 生成された型ファイルのフォーマットが失敗する
   - prettier がインストールされているか確認してください
   - プロジェクトルートディレクトリに prettier 設定ファイルがあるか確認してください

2. リクエスト関数のインポートパスエラー
   - requestMethodsImportPath 設定が正しいか確認してください
   - リクエストメソッドファイルが存在するか確認してください

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

### 設定の詳細

#### 1. ESLint 設定

- 必要な依存関係を自動インストール
- React/Vue フレームワークをサポート
- `.eslintrc.js` と `.eslintignore` を自動生成
- TypeScript サポートを統合

#### 2. Prettier 設定

- prettier 関連の依存関係を自動インストール
- `.prettierrc.js` 設定ファイルを生成
- デフォルト設定には以下が含まれます：
  - 行幅：80
  - Tab インデント
  - シングルクォートを使用
  - アロー関数の括弧
  - その他のコードスタイル規約

#### 3. CommitLint 設定

- commitlint 関連の依存関係をインストール
- husky git hooks を設定
- `commitlint.config.js` を生成
- git commit メッセージを標準化

#### 4. VSCode 設定

- `.vscode/settings.json` を作成
- エディタの自動フォーマットを設定
- デフォルトのフォーマットツールを設定
- 既存の設定ファイルの更新をサポート

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
