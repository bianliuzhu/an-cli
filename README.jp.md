# an-cli

[English](./README.en.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | 日本語 | [简体中文](./README.md)

フロントエンドコマンドラインツール

Swagger JSONに基づいてTypeScriptの型定義とAPIリクエスト関数を自動生成するコマンドラインツール。

## 特徴

- 🚀 Swagger JSON文書の自動解析
- 📦 TypeScript型定義ファイルの生成
- 🔄 型安全なAPIリクエスト関数の生成
- 🎯 パスパラメータ、クエリパラメータ、リクエストボディのサポート
- 📝 列挙型定義の自動生成
- 🎨 コードフォーマットのサポート
- ⚡️ ファイルアップロードのサポート
- 🛠 設定可能なコード生成オプション

## インストール

```bash
$ npm install anl -g

$ yarn global add anl
```

## 使用方法

1. コマンドの実行

```bash
$ anl type
```

2. 設定の完了

- 初めて `anl type` コマンドを実行すると、*プロジェクトのルートディレクトリ*に `an.config.json` という名前の設定ファイルが*自動的に作成*されます（手動で作成することも可能です）。
- 具体的なパラメータについては設定項目の説明をご覧ください。
- 設定ファイル名は変更できません。

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
	"headers": {}
}
```

3. TypeScript型定義とAPIリクエスト関数の生成は、再度生成コマンドを実行するだけです。

```bash
$ anl type
```

## 設定項目の説明

| 設定項目                 | 型                           | 必須   | 説明                               |
| ------------------------ | ---------------------------- | ------ | ---------------------------------- |
| saveTypeFolderPath       | string                       | はい   | 型定義ファイルの保存パス           |
| saveApiListFolderPath    | string                       | はい   | APIリクエスト関数の保存パス        |
| saveEnumFolderPath       | string                       | はい   | 列挙型ファイルの保存パス           |
| importEnumPath           | string                       | はい   | 列挙型のインポートパス             |
| swaggerJsonUrl           | string                       | はい   | Swagger JSONドキュメントのURL      |
| requestMethodsImportPath | string                       | はい   | リクエストメソッドのインポートパス |
| dataLevel                | 'data' \| 'serve' \| 'axios' | はい   | インターフェースの戻り値レベル     |
| formatting               | object                       | いいえ | コードフォーマット設定             |
| headers                  | object                       | いいえ | リクエストヘッダー設定             |

## 生成されるファイル構造

- このファイル構造は設定ファイルに基づいて生成されます

project/
├── apps/
│ ├── types/
│ │ ├── models/ # すべての型定義ファイル（列挙型を除く）
│ │ ├── connectors/ # API型定義（インターフェース定義ファイル）
│ │ └── enums/ # 列挙型定義
│ └── api/
│ ├── fetch.ts # リクエストメソッドの実装
│ └── index.ts # APIリクエスト関数

## 生成されるコードの例

### 型定義ファイル

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

### APIリクエスト関数

```typescript
import { GET } from './fetch';

/**
 * ユーザー詳細の取得
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## 機能の説明

### 型解析

- OpenAPI 3.0仕様のすべてのデータ型をサポート
- 複雑なネスト型を自動処理
- 配列、オブジェクト、列挙型などをサポート
- インターフェースコメントを自動生成

### ファイルアップロード

ファイルアップロード型が検出された場合、対応するリクエストヘッダーが自動的に追加されます：

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### エラー処理

ツールには包括的なエラー処理メカニズムが組み込まれています：

- 解析エラーの通知
- 型生成失敗の警告
- ファイル書き込みの例外処理

## 開発

```bash
# 依存関係のインストール
npm install

# 開発モード
F5キーでデバッグ

# ビルド
npm run build

# ローカルリンクデバッグ
npm run blink
```

## 注意事項

1. Swagger JSONドキュメントのURLにアクセスできることを確認してください
2. 設定ファイルのパスはプロジェクトルートディレクトリからの相対パスである必要があります
3. 生成されたファイルは既存の同名ファイルを上書きします
4. 生成されたファイルはバージョン管理に含めることをお勧めします

## よくある質問

1. 生成された型ファイルのフォーマットに失敗する

   - prettierがインストールされているか確認してください
   - プロジェクトルートディレクトリにprettier設定ファイルが存在するか確認してください

2. リクエスト関数のインポートパスが間違っている
   - requestMethodsImportPathの設定が正しいか確認してください
   - リクエストメソッドファイルが存在するか確認してください

## 貢献ガイド

IssueやPull Requestを歓迎します！

## ライセンス

ISC License
