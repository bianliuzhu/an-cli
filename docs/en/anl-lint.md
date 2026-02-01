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
