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

### `.commit-type.cjs` and Commit Type Customization

When you choose "Automatic commit subject setting", the tool copies `.commit-type.cjs` into the project (if it does not exist). This file defines the **commit types** (subject prefixes) available when committing, e.g. `feat`, `fix`, `chore`, in line with CommitLint conventions.

**Example file structure:**

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
	// ... other types
};

module.exports = { types };
```

**Field descriptions:**

| Field         | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| `description` | Short description of the type, used in the interactive type selector.      |
| `title`       | Display title for the type.                                                 |
| `emoji`       | Optional emoji associated with the type.                                   |
| `subject`     | Prefix written into the commit message; must match CommitLint (e.g. `feat`, `fix`, `docs`). |

You can add, remove, or change entries under `types` to match your team's conventions; after saving, the commit type picker will use the updated list.

### Notes

- Please run within a Git repository.
- If automatically executed git config fails, please execute manually:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```
