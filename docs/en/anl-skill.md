# `anl skill` Command

### Feature Overview

`anl skill` is an Agent Skill initialization tool that generates AI-assisted development Skill files in your project.

Currently supports two Skills:

| Skill          | Description                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **api-report** | API Change Detection Report — compares API file changes via git diff, analyzes type changes and impact scope, generates a structured report |
| **api-mock**   | Mock Data Generation — generates MockJS-compliant mock data files based on API definitions and associated types                             |

### Prerequisites

- An `an.config.json` configuration file must exist in the project root
- `an.config.json` must contain `swaggerConfig` (with `apiListFileName`, `url`, etc.)
- It is recommended to run `anl type` first to generate API files and type definitions before using `anl skill`

### Usage

```bash
$ anl skill
```

### Interactive Flow

```
🛡️  an skill - Agent Skill Initializer

? Select Skills to initialize (multi-select):
  [x] api-report  - API Change Detection Report
  [x] api-mock    - Mock Data Generation

? Skill output target:
  ❯ .cursor/skills    (Cursor Skill)
    .claude/commands  (Claude Code /command)
    Custom path...

📋 Configuration read from an.config.json:
  - API directory: src/api
  - API files: op.ts, index.ts
  - Types directory: src/types
  - Output: .cursor/skills  (Skill mode)

? Directories to scan for API usage (comma-separated, glob supported): src/pages/**,src/components/**
? Mock data output directory: mocks/

🥂 Skill file written: .cursor/skills/api-report/SKILL.md
🥂 Skill file written: .cursor/skills/api-mock/SKILL.md

✅ Skill initialization complete!
```

### Interactive Options

#### 1. Select Skills

Multi-select supported. Use spacebar to toggle selection, Enter to confirm. At least one Skill must be selected.

#### 2. Select Output Target

Choose the output format based on your AI tool:

| Option             | Output Path                      | File Structure       | Tool        |
| ------------------ | -------------------------------- | -------------------- | ----------- |
| `.cursor/skills`   | `.cursor/skills/<name>/SKILL.md` | Directory + SKILL.md | Cursor      |
| `.claude/commands` | `.claude/commands/<name>.md`     | Single file          | Claude Code |
| Custom path        | User-specified                   | Either of the above  | Others      |

#### 3. api-report Configuration

| Prompt                            | Default                          | Description                                                                                        |
| --------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Directories to scan for API usage | `src/pages/**,src/components/**` | Comma-separated, glob supported. Used to detect where changed APIs are referenced in business code |

#### 4. api-mock Configuration

| Prompt                     | Default  | Description                             |
| -------------------------- | -------- | --------------------------------------- |
| Mock data output directory | `mocks/` | Directory for generated mock JSON files |

### Auto-detected Configuration

The command automatically reads the following from the project's `an.config.json` — no manual input required:

| Config              | Source Field                      | Description                                      |
| ------------------- | --------------------------------- | ------------------------------------------------ |
| API file directory  | `saveApiListFolderPath`           | e.g. `src/api`                                   |
| Types directory     | `saveTypeFolderPath`              | e.g. `src/types`                                 |
| API file names      | `swaggerConfig[].apiListFileName` | e.g. `op.ts`, `index.ts`                         |
| Swagger source URLs | `swaggerConfig[].url`             | Written into the Skill template for AI reference |

### Using in Different Tools

#### Using in Cursor

After Skill files are generated to `.cursor/skills/`, Cursor's AI will automatically recognize and use them when appropriate.

Usage: simply describe your needs in natural language in Cursor chat, for example:

- **API change detection**: `"Detect API changes and generate a change report"` or `"Analyze the impact of changes in src/api"`
- **Mock data generation**: `"Generate mock data for all endpoints"` or `"Generate mock data for opTradeOrderQuerypage_POST"`

#### Using in Claude Code

After Skill files are generated to `.claude/commands/`, invoke them via slash commands:

```bash
/api-report    # Run API change detection
/api-mock      # Run mock data generation
```

### Skill Details

#### api-report — API Change Detection Report

**How it works:**

1. Compares API files (e.g. `op.ts`, `index.ts`) against git history via `git diff`
2. Parses changed API endpoints (based on the `export const xxx_GET/POST` naming pattern)
3. Detects request/response type changes in `types/connectors/`
4. Detects shared model changes in `types/models/`
5. Scans specified directories for references to changed APIs
6. Outputs a structured report categorized as Breaking Changes / Warnings / Compatible Changes

**Detected change types:**

| Change Type           | Severity   | Description                                |
| --------------------- | ---------- | ------------------------------------------ |
| Endpoint removed      | Breaking   | `export const xxx` line deleted            |
| Path changed          | Breaking   | URL path of same-named function changed    |
| Parameter changed     | Breaking   | Function signature parameter types changed |
| HTTP method changed   | Breaking   | GET/POST/PUT/DELETE changed                |
| Response type changed | Warning    | Generic `<ResponseType>` changed           |
| Endpoint added        | Compatible | New `export const xxx` added               |

#### api-mock — Mock Data Generation

**How it works:**

1. Parses all exported API functions from API files, extracting function name, HTTP method, URL path, and response type
2. Traces Response types from `types/connectors/` to actual interface definitions in `types/models/`
3. Recursively resolves nested type references to obtain full field structure
4. Generates mock data intelligently based on field names and types
5. Outputs mock JSON files in the project's established format

**Generated mock file format:**

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

**Features:**

- File header `@url` + `@method` comments for mock middleware route matching
- Unified `{ success, code, message, data }` response structure
- MockJS syntax for paginated lists (e.g. `"records|20": [...]`)
- Intelligent data inference based on field names (phone numbers, timestamps, prices, enum values, etc.)
- Checks existing mock files before generation to avoid overwrites

### Generated Files

Depending on the selected output target, the file structure is:

**Cursor mode:**

```
project/
├── .cursor/
│   └── skills/
│       ├── api-report/
│       │   └── SKILL.md          # API Change Detection Report Skill
│       └── api-mock/
│           └── SKILL.md          # Mock Data Generation Skill
```

**Claude Code mode:**

```
project/
├── .claude/
│   └── commands/
│       ├── api-report.md         # /api-report command
│       └── api-mock.md           # /api-mock command
```

### Notes

1. Skill file configurations (API paths, type paths, etc.) are sourced from `an.config.json`; re-run `anl skill` to update after config changes
2. Re-running `anl skill` will overwrite existing Skill files
3. It is recommended to commit generated Skill files to version control for team sharing
4. The api-report Skill relies on git history; on first API generation with no prior version, it will only list current endpoints
5. Mock files generated by api-mock use JSON format, but the header `/** ... */` comment is a project convention (not standard JSON)
