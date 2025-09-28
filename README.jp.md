# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | 日本語

## 説明

an-cli は以下のコマンドを提供するフロントエンド向け CLI ツールです：

> `anl type`: Swagger/OpenAPI の JSON に基づいて、TypeScript 型定義と API リクエスト関数を自動生成する CLI ツール。

> `anl lint`: React または Vue プロジェクト向けに、ESLint、Stylelint、Prettier、CommitLint、VSCode 設定を生成。

> `anl git`: gitflow 標準ブランチの作成、コミットメッセージのサブジェクト設定、カスタム Git コマンドなどのローカル Git 設定を生成。

## 機能

- `anl type`
  - 🚀 Swagger JSON ドキュメントを自動解析
  - 📦 TypeScript 型定義ファイルを生成
  - 🔄 型安全な API リクエスト関数を生成
  - 🎯 パス・クエリ・ボディの各パラメータに対応
  - 📝 列挙型の定義を自動生成
  - 🎨 コード整形をサポート
  - ⚡️ ファイルアップロードをサポート
  - 🛠 柔軟な生成オプション

- `anl lint`
  - 🔍 各種 Lint ツールをワンクリック設定
  - 🎨 ESLint 設定を自動化
  - 🎯 Prettier 設定
  - 🔄 CommitLint によるコミット規約
  - 📦 VSCode エディタ設定

## インストール

> 注意
>
> グローバルインストールが必要です

```bash
$ npm install anl -g

$ yarn global add anl
```

## 使い方

> ヒント
>
> 1. 初めての場合はまずコマンドを実行し、プロジェクトにどんな変化が起きるかを確認してください。その後、ドキュメントを参照しつつ設定を調整・再生成し、理想の形に近づけます。
> 2. もしくは以下の手順に従って一歩ずつ進めてください。

# anl type コマンド

## 手順

1. コマンドを実行

```bash
$ anl type
```

2. 設定ファイルの説明

- 初回の `anl type` 実行時、プロジェクトルートに `an.config.json` が自動作成されます（手動作成も可）。
- 実行時にルートの `an.config.json` を読み込み、Axios ラッパー、設定、API 一覧、リクエスト/レスポンス型を生成します。
- 設定項目は自由に編集できます。

3. `an.config.json` の例

- 設定ファイルはプロジェクトルート固定です。
- ファイル名は変更不可です。
- パラメータの詳細は「設定項目」を参照してください。

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

3. 必要に応じて設定を更新し、再度 `anl type` を実行してください。設定に基づいて生成されます。

```bash
$ anl type
```

> 注意
>
> 不明点がある場合は、まず一度 `anl type` を実行して出力を確認し、説明を参考に設定を調整して再実行してください。

## 設定項目

| 項目                     | 型                                    | 必須   | 説明                                 |
| ------------------------ | ------------------------------------- | ------ | ------------------------------------ |
| saveTypeFolderPath       | string                                | はい   | 型定義ファイルの保存パス             |
| saveApiListFolderPath    | string                                | はい   | API リクエスト関数ファイルの保存パス |
| saveEnumFolderPath       | string                                | はい   | 列挙型ファイルの保存パス             |
| importEnumPath           | string                                | はい   | 列挙型のインポートパス               |
| swaggerJsonUrl           | string                                | はい   | Swagger JSON の URL                  |
| requestMethodsImportPath | string                                | はい   | リクエストメソッドのインポートパス   |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | はい   | レスポンスデータの階層               |
| formatting               | object                                | いいえ | コード整形の設定                     |
| headers                  | object                                | いいえ | リクエストヘッダー                   |
| includeInterface         | Array<{path: string, method: string}> | いいえ | 生成対象をこのリストに限定           |
| excludeInterface         | Array<{path: string, method: string}> | いいえ | このリストのインターフェースを除外   |

## 生成されるファイル構成

- 以下の構成は設定ファイルに基づいて生成されます。

```
project/
├── apps/
│   ├── types/
│   │   ├── models/          # 列挙型を除くすべての型定義
│   │   ├── connectors/      # API 型定義（インターフェース定義）
│   │   └── enums/           # 列挙型定義
│   └── api/
│       ├── fetch.ts         # リクエストメソッド実装
│       └── index.ts         # API リクエスト関数
```

## 生成コード例

### 型定義

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

### API リクエスト関数

```typescript
import { GET } from './fetch';

/**
 * ユーザー詳細を取得
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## 追加機能

### 型解析

- OpenAPI 3.0 の全データ型に対応
- 複雑なネスト型を自動処理
- 配列、オブジェクト、列挙型などに対応
- インターフェースコメントを自動生成

### ファイルアップロード

アップロード型を検出した場合、適切なヘッダーを自動付与：

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### エラーハンドリング

堅牢なエラーハンドリングを内蔵：

- 解析エラーメッセージ
- 型生成失敗時の警告
- ファイル書き込み時の例外処理

### インターフェースのフィルタリング

設定により生成対象を制御：

1. 特定のインターフェースを含める
   - `includeInterface` で生成対象を指定
   - 指定されたもののみ生成
   - 形式：`path` と `method` を持つオブジェクト配列

2. 特定のインターフェースを除外
   - `excludeInterface` で除外対象を指定
   - その他は生成
   - 形式：`path` と `method` を持つオブジェクト配列

例：

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

注意：`includeInterface` と `excludeInterface` は同時使用できません。両方設定された場合は `includeInterface` が優先されます。

## 開発

```bash
# 依存関係のインストール
npm install

# 開発モード
F5 を押してデバッグ

# ビルド
npm run build

# ローカルリンクでのデバッグ
npm run blink
```

## 注意事項

1. Swagger JSON の URL にアクセスできることを確認
2. 設定ファイル内のパスはプロジェクトルート起点
3. 生成ファイルは同名の既存ファイルを上書き
4. 生成ファイルはバージョン管理に含めることを推奨

## よくある質問

1. 生成された型ファイルの整形に失敗する
   - Prettier がインストールされているか確認
   - プロジェクトルートに Prettier 設定があるか確認

2. リクエスト関数のインポートパスが誤っている
   - `requestMethodsImportPath` が正しいか確認
   - リクエストメソッドのファイルが存在するか確認

# anl lint コマンド

### 概要

フロントエンドの各種 Lint ツールをワンクリックで設定：

- ESLint によるコードチェック
- Prettier による整形
- CommitLint によるコミットメッセージ規約
- VSCode エディタ設定

### 使い方

```bash
$ anl lint
```

### 設定詳細

#### 1. ESLint

- 必要な依存を自動インストール
- React/Vue をサポート
- `.eslintrc.js` と `.eslintignore` を生成
- TypeScript を統合

#### 2. Prettier

- Prettier 関連依存を自動インストール
- `.prettierrc.js` を生成
- 既定：
  - 行幅 80
  - タブインデント
  - シングルクォート
  - アロー関数の括弧
  - その他スタイル規約

#### 3. CommitLint

- CommitLint 依存をインストール
- Husky git hooks を設定
- `commitlint.config.js` を生成
- コミットメッセージを標準化

#### 4. VSCode

- `.vscode/settings.json` を作成
- 保存時の自動整形を設定
- 既定のフォーマッタを設定
- 既存設定の更新に対応

# anl git コマンド

### 概要

対話式の複数選択で、現在のリポジトリに以下の Git 機能を適用：

- gitflow 標準ブランチの作成
  - `.gitscripts/`、`.gitconfig`、`.commit-type.cjs` をプロジェクトにコピー（不足時のみ）
  - `.gitscripts/random-branch.sh` に実行権限を付与
  - `git config --local include.path ../.gitconfig` を実行
- コミットサブジェクトの自動設定
  - `.githooks/commit-msg` をコピーし実行可能に設定
  - `git config core.hooksPath .githooks` を実行
- カスタム Git コマンド
  - `.gitattributes` を追加（不足時のみ）

### 使い方

```bash
$ anl git
```

プロンプトで 1 つ以上の機能を選択します。ファイルは不足時のみ作成され、既存ファイルは保持されます。

### 注意

- 必ず Git リポジトリ内で実行してください。
- 自動設定が失敗した場合は手動で実行：

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# ライセンス

ISC License

# コントリビューション

Issues / Pull Requests を歓迎します: https://github.com/bianliuzhu/an-cli
