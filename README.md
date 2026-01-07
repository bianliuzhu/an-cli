# an-cli

[简体中文](./README.zh.md) | English | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md)

# Overview

> an-cli is a frontend command-line tool that includes the following commands:
>
> - `anl type` command: A command-line tool that automatically generates TypeScript type definitions and API request functions based on Swagger JSON.
> - `anl lint` command: Generates eslint, stylelint, prettier, commitLint, and VSCode related configurations for React or Vue projects
> - `anl git` command: Generates git local configuration with optional features: gitflow standard branch creation, git commit messages subject, and git custom command configuration

# Features

- `anl type`
  - 🚀 Automatically parses Swagger JSON documentation
  - 📦 Generates TypeScript type definition files
  - 🔄 Generates type-safe API request functions
  - 🎯 Supports path parameters, query parameters, and request body
  - 📝 Automatically generates enum type definitions
  - 🎨 Supports code formatting
  - ⚡️ Supports file upload
  - 🛠 Configurable code generation options
  - 🌐 Supports multiple Swagger server configurations
  - 🔧 Supports HTTP methods like OPTIONS, HEAD, SEARCH

- `anl lint`
  - 🔍 One-click configuration for various lint tools
  - 🎨 Automated ESLint configuration
  - 🎯 Prettier formatting configuration
  - 🔄 CommitLint commit standards
  - 📦 VSCode editor configuration

- `anl git`
  - 🔍 Multiple optional features for installation
  - 🎨 Standard git flow branch creation
  - 🎯 Automatic subject setting that complies with CommitLint commit standards
  - 🔄 Provides git custom command configuration and entry points
  - 📦 Automated generation with zero configuration

# Installation

> [!NOTE]
> Requires global installation

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

# Usage

> [!TIP]
>
> 1. If you're using it for the first time and unsure about the results, it's recommended to execute the command first, observe what changes occur in the project, then combine with the documentation to further modify the configuration and regenerate until you achieve your ideal setup
> 2. Or follow the steps below step by step for results
> 3. Please execute `anl type`, `anl lint`, `anl git` commands in the project root directory

## `anl type` Command Usage

- **First time** executing the `anl type` command will automatically create a configuration file named `an.config.json` in the _project root directory_ (can also be created manually) to initialize the configuration template.

- When executing the `anl type` command, it will look for the `an.config.json` configuration file in the user's project root directory, read its configuration information, and generate corresponding axios encapsulation, configuration, interface list, interface requests, and TS types for each interface request parameters and responses

- Configuration items in the configuration file can be freely modified

- About the `an.config.json` configuration file
  - The configuration file must be in the project root directory

  - The configuration file name cannot be changed

  - For specific parameter descriptions, see [Configuration File Details](#configuration-file-details)

- Update the configuration file according to your needs, then execute the `anl type` command again, and it will generate corresponding type information according to the specified configuration information in the configuration file

- If files like 'config.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts' exist, they will not be regenerated

> [!NOTE]
>
> If you're unclear about these configurations, you can first execute the anl type command to generate the types, then check the project directory, combine with the configuration item descriptions, adjust the configuration items, and regenerate to gradually verify the role of configuration items and complete the final configuration

### Usage Method

```bash
$ anl type
```

### Configuration File Details

#### Configuration File Example

**Single Swagger Server Configuration:**

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
			"method": "get",
			"dataLevel": "data"
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

**Multiple Swagger Servers Configuration:**

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

#### Configuration Item Descriptions

| Configuration Item                 | Type                                  | Required | Description                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| saveTypeFolderPath                 | string                                | Yes      | Type definition file save path                                                                                                                                                                                                                                                                                                                 |
| saveApiListFolderPath              | string                                | Yes      | API request function file save path                                                                                                                                                                                                                                                                                                            |
| saveEnumFolderPath                 | string                                | Yes      | Enum data file save path                                                                                                                                                                                                                                                                                                                       |
| importEnumPath                     | string                                | Yes      | Enum import path (path referenced by enum files in apps/types/models/\*.ts)                                                                                                                                                                                                                                                                    |
| swaggerJsonUrl                     | string                                | No       | Swagger JSON documentation address (migrated to `swaggerConfig`, retained for backward compatibility) **This field will be removed in future versions**                                                                                                                                                                                        |
| swaggerConfig                      | object \| Array<object>               | No       | Swagger server configuration. Single server can be an object, multiple servers use an array. Each server can configure `url`, `publicPrefix`, `modulePrefix`, `apiListFileName`, `headers`, `dataLevel`, `parameterSeparator`, `includeInterface`, `excludeInterface`<br />See single and multiple Swagger server configuration examples above |
| swaggerConfig[].url                | string                                | Yes      | Swagger JSON documentation address                                                                                                                                                                                                                                                                                                             |
| swaggerConfig[].publicPrefix       | string                                | No       | Common prefix on url path, e.g.: api/users, api/users/{id}, api is the common prefix                                                                                                                                                                                                                                                           |
| swaggerConfig[].apiListFileName    | string                                | No       | API list file name, defaults to `index.ts`. When using multiple servers, each server's file name must be unique                                                                                                                                                                                                                                |
| swaggerConfig[].headers            | object                                | No       | Request header configuration for this server                                                                                                                                                                                                                                                                                                   |
| swaggerConfig[].modulePrefix       | string                                | No       | Request path prefix (can be understood as module name), automatically added to the front of each API request path.<br />For example: when `modulePrefix: "/forward"`<br />`/publicPrefix/modulePrefix/user` becomes `/api/forward/user`                                                                                                        |
| swaggerConfig[].dataLevel          | 'data' \| 'serve' \| 'axios'          | No       | Interface return data level for this server. If not set, uses global `dataLevel` configuration                                                                                                                                                                                                                                                 |
| swaggerConfig[].parameterSeparator | '$' \| '\_'                           | No       | Separator used when generating API names and type names for this server. If not set, uses global `parameterSeparator` configuration                                                                                                                                                                                                            |
| swaggerConfig[].includeInterface   | Array<{path: string, method: string, dataLevel?: 'data' \| 'serve' \| 'axios'}> | No       | List of interfaces to include for this server. Each interface can configure `dataLevel` individually with the highest priority. If not set, uses global `includeInterface` configuration                                                                                                                                                                                                                        |
| swaggerConfig[].excludeInterface   | Array<{path: string, method: string}> | No       | List of interfaces to exclude for this server. If not set, uses global `excludeInterface` configuration                                                                                                                                                                                                                                        |
| requestMethodsImportPath           | string                                | Yes      | Request method import path                                                                                                                                                                                                                                                                                                                     |
| dataLevel                          | 'data' \| 'serve' \| 'axios'          | No       | Global interface return data level configuration, default: `'serve'`. Each server can override individually                                                                                                                                                                                                                                    |
| formatting                         | object                                | No       | Code formatting configuration                                                                                                                                                                                                                                                                                                                  |
| formatting.indentation             | string                                | No       | Code indentation character, e.g.: `"\t"` or `"  "` (two spaces)                                                                                                                                                                                                                                                                                |
| formatting.lineEnding              | string                                | No       | Line ending, e.g.: `"\n"` (LF) or `"\r\n"` (CRLF)                                                                                                                                                                                                                                                                                              |
| headers                            | object                                | No       | Request header configuration (migrated to `swaggerConfig`, retained for backward compatibility)                                                                                                                                                                                                                                                |
| includeInterface                   | Array<{path: string, method: string, dataLevel?: 'data' \| 'serve' \| 'axios'}> | No       | Global included interfaces: The interface list file specified by `saveApiListFolderPath` will only include interfaces in the list, mutually exclusive with `excludeInterface` field. Each interface can configure `dataLevel` individually. Each server can override individually                                                                                                                     |
| excludeInterface                   | Array<{path: string, method: string}> | No       | Global excluded interfaces: The interface list file specified by `saveApiListFolderPath` will not include interfaces in this list, mutually exclusive with `includeInterface`. Each server can override individually                                                                                                                           |
| publicPrefix                       | string                                | No       | Global common prefix on url path (migrated to `swaggerConfig`, retained for backward compatibility)                                                                                                                                                                                                                                            |
| modulePrefix                       | string                                | No       | Global request path prefix (each server can override individually)                                                                                                                                                                                                                                                                             |
| apiListFileName                    | string                                | No       | Global API list file name, defaults to `index.ts` (migrated to `swaggerConfig`, retained for backward compatibility)                                                                                                                                                                                                                           |
| enmuConfig                         | object                                | Yes      | Enum configuration object                                                                                                                                                                                                                                                                                                                      |
| enmuConfig.erasableSyntaxOnly      | boolean                               | Yes      | Align with tsconfig.json `compilerOptions.erasableSyntaxOnly`. When `true`, generates const objects instead of enums (type-only syntax). Default: `false`                                                                                                                                                                                      |
| enmuConfig.varnames                | string                                | No       | Swagger schema field name for custom enum member names. Default: `enum-varnames`.                                                                                                                                                                                                                                                              |
| enmuConfig.comment                 | string                                | No       | Swagger schema field name for custom enum descriptions (used for generating comments). Default: `enum-descriptions`.                                                                                                                                                                                                                           |
| parameterSeparator                 | '$' \| '\_'                           | No       | Global separator used between path segments and parameters when generating API names and type names. For example, `/users/{userId}/posts` with separator `'_'` generates `users_userId_posts_GET`. Default: `'_'`. Each server can override individually                                                                                       |
| enmuConfig.varnames                | string                                | No       | Schema field name that stores custom enum member identifiers. Default: `enum-varnames`.                                                                                                                                                                                                                                                        |
| enmuConfig.comment                 | string                                | No       | Schema field name that stores enum member descriptions (used for inline comments). Default: `enum-descriptions`.                                                                                                                                                                                                                               |

#### Configuration Items and Generated Files Correspondence

> File structure is generated based on configuration file, marked **uncontrolled** indicates: The folder and its files are automatically generated and not controlled by configuration items

```
project/
├── apps/
│   ├── types/               		# Specified by saveTypeFolderPath configuration item
│   │   ├── models/          				# All type definition files (excluding enum types) uncontrolled
│   │   ├── connectors/      				# API type definitions (interface definition files) uncontrolled
│   └── api/                 		# Request files: Specified by saveApiListFolderPath configuration item
│   │    └── index.ts        				# API request function list (single server or first server) uncontrolled
│   │    └── op.ts           				# Other servers' API list files when using multiple servers uncontrolled
│   │    └── api-type.d.ts      		# Request type definition file uncontrolled
│   │    └── config.ts       				# Request, response interceptor, request configuration uncontrolled
│   │    └── error-message.ts   		# System-level error messages uncontrolled
│   │    ├── fetch.ts        				# Axios request encapsulation, can be replaced with fetch uncontrolled
│   └── enums/               		# Enum data type definitions: Specified by saveEnumFolderPath configuration item
```

### Generated Code Examples

#### Interface Type Definition

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

#### API Request Function

```typescript
import { GET } from './fetch';

/**
 * Get user details
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

### Feature Descriptions

#### Configuration Priority

The tool supports global configuration and server-level configuration, following these priority rules:

**Priority: Interface-level configuration > Server-level configuration > Global configuration > Default values**

The following configuration items support multi-level priority override:

- `dataLevel`: Interface return data level
  - **Interface-level**: `includeInterface[].dataLevel` - Highest priority
  - **Server-level**: `swaggerConfig[].dataLevel` - Secondary priority
  - **Global configuration**: `dataLevel` - Base priority
  - **Default value**: `'serve'`
- `parameterSeparator`: Separator for API names and type names
- `includeInterface`: List of included interfaces
- `excludeInterface`: List of excluded interfaces
- `modulePrefix`: Request path prefix
- `publicPrefix`: URL common prefix
- `headers`: Request header configuration

**Example:**

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

In the above configuration:

- `api1.ts` uses `dataLevel: "data"` (server-level configuration)
- `api2.ts` uses `dataLevel: "serve"` (global configuration)
- Both servers use `parameterSeparator: "_"` (global configuration)

#### Type Parsing

- Supports all OpenAPI 3.0 specification data types
- Automatically handles complex nested types
- Supports arrays, objects, enums, and other types
- Automatically generates interface comments

#### Enum Generation

The tool supports two enum generation modes, controlled by the `enmuConfig.erasableSyntaxOnly` configuration:

**Traditional Enum Mode** (`enmuConfig.erasableSyntaxOnly: false`, default):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**Const Object Mode** (`enmuConfig.erasableSyntaxOnly: true`):

```typescript
export const Status = {
	Success: 'Success',
	Error: 'Error',
	Pending: 'Pending',
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];
```

> **Why use const object mode?**
> When TypeScript's `compilerOptions.erasableSyntaxOnly` is set to `true`, the code can only use type-erasable syntax. Traditional `enum` generates runtime code, while const objects are type-only and get completely erased during compilation. This ensures compatibility with build tools that require type-only syntax.

**Usage in types:**

```typescript
// Traditional enum mode
interface User {
	status: Status; // Use enum as type directly
}

// Const object mode
interface User {
	status: StatusType; // Use the generated type with 'Type' suffix
}
```

#### Data Level Configuration (dataLevel)

`dataLevel` is used to configure the extraction level of interface return data, supporting three options:

1. **`'serve'` (default)**: Extracts the `data` field from server response

   ```typescript
   // Server returns: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // Function returns: { id: 1, name: 'user' }
   ```

2. **`'data'`**: Extracts the `data.data` field (for nested data scenarios)

   ```typescript
   // Server returns: { data: { code: 200, data: { id: 1, name: 'user' } } }
   // Function returns: { id: 1, name: 'user' }
   ```

3. **`'axios'`**: Returns the complete axios response object
   ```typescript
   // Server returns: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // Function returns: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   ```

**Configuration Priority:**

`dataLevel` supports three-level configuration priority:

```
Interface-level > Server-level > Global configuration > Default value
```

**Configuration example:**

```json
{
	"dataLevel": "serve",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data",
			"includeInterface": [
				{
					"path": "/api/user/detail",
					"method": "get",
					"dataLevel": "axios"
				},
				{
					"path": "/api/user/list",
					"method": "get"
				}
			]
		}
	]
}
```

In the above configuration:
- `/api/user/detail` interface uses `dataLevel: "axios"` (interface-level configuration, highest priority)
- `/api/user/list` interface uses `dataLevel: "data"` (server-level configuration)
- Other server interfaces use `dataLevel: "serve"` (global configuration)

> **Note**:
> - Interface-level `dataLevel` configuration has the highest priority, suitable for scenarios where individual interfaces need special handling
> - Server-level `dataLevel` configuration will override global configuration
> - Uses default value `'serve'` when not configured

#### Code Formatting

The tool supports custom code formatting options, controlled by the `formatting` configuration:

**Configuration example:**

```json
{
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	}
}
```

**Configuration description:**

- `indentation`: Code indentation character
  - `"\t"`: Use Tab indentation (default)
  - `"  "`: Use 2 spaces indentation
  - `"    "`: Use 4 spaces indentation
- `lineEnding`: Line ending type
  - `"\n"`: LF (Linux/macOS style, recommended)
  - `"\r\n"`: CRLF (Windows style)

**Note:** If Prettier is configured in the project, the generated code will automatically use Prettier for formatting, and the `formatting` configuration may be overridden by Prettier.

#### File Upload

When file upload types are detected, corresponding request headers are automatically added:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### Error Handling

The tool has built-in comprehensive error handling mechanisms:

- Parse error prompts
- Type generation failure warnings
- File write exception handling

#### Interface Filtering

The tool supports filtering interfaces to be generated through configuration:

1. Include specific interfaces
   - Specify interfaces to be generated through the `includeInterface` configuration item
   - Only interfaces specified in the configuration will be generated
   - Configuration format is an object array containing `path`, `method`, and optional `dataLevel`
   - Each interface can configure `dataLevel` individually with the highest priority

2. Exclude specific interfaces
   - Specify interfaces to be excluded through the `excludeInterface` configuration item
   - All interfaces except those specified in the configuration will be generated
   - Configuration format is an object array containing `path` and `method`

Example configuration: This configuration is in `an.config.json`

```json
{
	"includeInterface": [
		{
			"path": "/api/user",
			"method": "get",
			"dataLevel": "data"
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

Note: `includeInterface` and `excludeInterface` cannot be used simultaneously. If both are configured, `includeInterface` will be prioritized.

#### Multiple Swagger Servers Support

The tool supports configuring multiple Swagger servers, each server can be configured independently:

- **Single server**: `swaggerConfig` can be directly filled with an object
- **Multiple servers**: `swaggerConfig` uses an array format, each server must configure a unique `apiListFileName`

**How it works:**

- The first server's APIs will be generated to the specified `apiListFileName` (defaults to `index.ts`)
- Subsequent servers' APIs will be appended to their respective `apiListFileName` files
- Type definitions and enums will be merged into a unified folder to avoid duplication

**Server-level configuration:**

Each server supports independent configuration of the following options. If not set, global configuration will be used:

- `dataLevel` - Interface return data level
- `parameterSeparator` - Separator for API names and type names
- `includeInterface` - List of included interfaces
- `excludeInterface` - List of excluded interfaces
- `modulePrefix` - Request path prefix

#### Path Prefix (modulePrefix)

`modulePrefix` is used to automatically add a prefix to all API request paths, which is particularly useful in the following scenarios:

1. **Reverse proxy scenarios**: When backend services are forwarded through a reverse proxy
2. **API Gateway**: Uniformly add gateway prefix to paths
3. **Multi-environment configuration**: Use different path prefixes for different environments

**Usage example:**

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

**Effect:**

The path `/api/user/list` defined in Swagger will be generated as:

```typescript
export const apiUserListGet = (params: ApiUserList_GET.Query) => GET<ApiUserList_GET.Response>('/forward/api/user/list', params);
```

**Difference from publicPrefix:**

- `publicPrefix`: Used to remove common prefix from interface paths (only affects generated function names)
- `modulePrefix`: Used to add prefix to actual request paths (affects runtime request URLs)

**Configuration example:**

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

**Migration notes:**

- Old configuration (`swaggerJsonUrl`, `publicPrefix`, `headers`) is still compatible
- The tool will automatically detect old configuration and suggest migration methods
- It's recommended to migrate to the new `swaggerConfig` configuration for better flexibility

#### HTTP Method Support

The tool supports the following HTTP methods:

- `GET` - Get resources
- `POST` - Create resources
- `PUT` - Update resources (full replacement)
- `PATCH` - Update resources (partial update)
- `DELETE` - Delete resources
- `OPTIONS` - Preflight requests
- `HEAD` - Get response headers
- `SEARCH` - Search requests

All methods support type-safe parameter and response type definitions.

### Notes

1. Ensure the Swagger JSON documentation address is accessible
2. Paths in the configuration file need to be relative to the project root directory
3. Generated files will overwrite existing files with the same name (but `config.ts`, `error-message.ts`, `fetch.ts`, `api-type.d.ts` will not be overwritten if they already exist)
4. It's recommended to add generated files to version control
5. When using multiple Swagger servers, ensure each server's `apiListFileName` is unique to avoid file overwriting
6. When configuring multiple servers, type definitions and enums will be merged. If different servers have types with the same name, conflicts may occur
7. Server-level configuration (`dataLevel`, `parameterSeparator`, `includeInterface`, `excludeInterface`, `modulePrefix`) will override global configuration
8. `includeInterface` and `excludeInterface` cannot be configured simultaneously. If both are configured, `includeInterface` will be prioritized

### Common Issues

1. **Generated type file formatting fails**
   - Check if prettier is installed
   - Confirm if there's a prettier configuration file in the project root directory
   - Check if the `formatting` configuration is correct

2. **Request function import path error**
   - Check if the `requestMethodsImportPath` configuration is correct
   - Confirm if the request method file exists

3. **When to use `modulePrefix`?**
   - When your APIs need to be accessed through a reverse proxy or gateway
   - For example: Swagger defines `/api/user`, but the actual request needs to be `/gateway/api/user`
   - Set `modulePrefix: "/gateway"` to achieve this

4. **What's the difference between `publicPrefix` and `modulePrefix`?**
   - `publicPrefix`: Removes prefix from interface paths, only affects generated function names
     - Example: `/api/user/list` after removing `/api`, function name becomes `userListGet`
   - `modulePrefix`: Adds prefix to request paths, affects actual request URLs
     - Example: `/api/user/list` after adding `/forward`, request URL becomes `/forward/api/user/list`

5. **How to configure different `dataLevel` for multiple servers?**

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

   - `old-api.ts` uses `dataLevel: "axios"`
   - `new-api.ts` uses the global `dataLevel: "serve"`

6. **How to configure different `dataLevel` for individual interfaces?**

   ```json
   {
   	"dataLevel": "serve",
   	"swaggerConfig": [
   		{
   			"url": "http://api.com/swagger.json",
   			"apiListFileName": "api.ts",
   			"dataLevel": "data",
   			"includeInterface": [
   				{
   					"path": "/api/user/detail",
   					"method": "get",
   					"dataLevel": "axios"
   				},
   				{
   					"path": "/api/user/list",
   					"method": "get"
   				}
   			]
   		}
   	]
   }
   ```

   - `/api/user/detail` uses interface-level `dataLevel: "axios"` (highest priority)
   - `/api/user/list` uses server-level `dataLevel: "data"`
   - Other server interfaces use global `dataLevel: "serve"`

7. **How to generate only specific interfaces?**
   - Use `includeInterface` configuration:
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
   - Or use `excludeInterface` to exclude unwanted interfaces

8. **What if generated files are overwritten?**
   - Files like `config.ts`, `error-message.ts`, `fetch.ts`, `api-type.d.ts` are only generated when they don't exist
   - API list files and type files are regenerated each time
   - It's recommended to add generated files to version control for easy tracking of changes

# `anl lint` Command Usage

> Provides **interactive multi-select** configuration for various lint tools in frontend projects, including:
>
> - ESLint - JavaScript/TypeScript code linting
> - Stylelint - CSS/SCSS/Less style linting
> - Prettier - Code formatting
> - CommitLint - Git commit message standards
> - VSCode - Editor configuration

### Usage Method

```bash
$ anl lint
```

After executing the command, an interactive multi-select interface will appear where you can choose the tools to install:

```
? Select the linting tools to install (multi-select):
❯◯ ESLint - JavaScript/TypeScript linter
 ◯ Stylelint - CSS/SCSS/Less linter
 ◯ Commitlint - Git commit message linter
 ◯ Prettier - Code formatter
 ◯ VSCode - Editor settings
```

Use **spacebar** to select/deselect, **Enter** to confirm.

### Configuration Details

#### 1. ESLint Configuration

- Automatically installs required dependencies
- Supports React/Vue frameworks (you'll be prompted to choose a framework if selected)
- Automatically generates `.eslintrc.js` and `.eslintignore`
- Integrates TypeScript support

#### 2. Stylelint Configuration

- Automatically installs stylelint related dependencies
- Supports Less/Sass preprocessors (you'll be prompted to choose a preprocessor if selected)
- Generates `.stylelintrc.js` configuration file
- Integrates Prettier support

#### 3. Prettier Configuration

- Automatically installs prettier related dependencies
- Generates `.prettierrc.js` configuration file
- Default configuration includes:
  - Line width: 80
  - Tab indentation
  - Use single quotes
  - Arrow function parentheses
  - Other code style standards

#### 4. CommitLint Configuration

- Installs commitlint related dependencies
- Configures husky git hooks
- Generates `commitlint.config.js`
- Standardizes git commit messages

#### 5. VSCode Configuration

- Creates `.vscode/settings.json`
- Configures editor auto-formatting
- Sets default formatting tools
- Supports updating existing configuration files

### Usage Examples

1. **Install ESLint and Prettier Only**
   - Select ESLint and Prettier
   - If ESLint is selected, you'll be prompted to choose a framework (React/Vue)
   - After installation, your project will have `.eslintrc.js` and `.prettierrc.js`

2. **Full Configuration**
   - Select all options
   - Complete the framework and preprocessor selection prompts
   - Your project will have a complete code standards system configured

# `anl git` Command

### Feature Overview

- Through interactive multi-selection, applies the following Git capabilities to the current repository:
  - gitflow standard branch creation
    - Copies `.gitscripts/`, `.gitconfig`, `.commit-type.cjs` to the project (only when missing)
    - Adds executable permissions to `.gitscripts/random-branch.sh`
    - Executes `git config --local include.path ../.gitconfig`
  - Automatic commit subject setting
    - Copies `.githooks/commit-msg` and sets it as executable
    - Executes `git config core.hooksPath .githooks`
  - Custom git commands
    - Adds `.gitattributes` to the project (only when missing)

### Usage Method

```bash
$ anl git
```

Select one or more features in the prompts. Files are only created when they don't exist; existing files are preserved.

### Notes

- Please run within a Git repository.
- If automatically executed git config fails, please execute manually:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# License

ISC License

# Contributing

Welcome to submit [Issues](https://github.com/bianliuzhu/an-cli/issues) and [Pull Requests](https://github.com/bianliuzhu/an-cli/pulls)!
