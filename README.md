# ReviewPrompt

A CLI tool that converts GitHub PR review comments into structured AI prompts, making it easier to address feedback using AI assistants.

## Getting Started

### 1. Create review comments with `[ai]` mention in your GitHub PR

Example:

```
[ai] This function needs error handling for edge cases.
```

### 2. Run ReviewPrompt

```bash
# Generate prompt from selected comments with interactive mode
npx reviewprompt https://github.com/owner/repo/pull/123 --clipboard

# Generate prompt from all comments
npx reviewprompt https://github.com/owner/repo/pull/123 --clipboard --all

# Resolve comments after generating prompt
npx reviewprompt https://github.com/owner/repo/pull/123 --clipboard --resolve
```

## Features

- 🔍 **Comment Filtering**: Filter PR comments by custom mentions (default: `[ai]`)
- 📋 **Interactive Selection**: Choose specific comments to include in your prompt
- 📄 **Smart Formatting**: Automatically formats comments with file paths and line numbers
- 🔗 **Multiple Actions**: View, resolve, or delete comments after processing
- 📋 **Clipboard Support**: Copy generated prompts directly to clipboard
- 🎯 **Flexible Mentions**: Use any custom mention format like `[bot]`, `[review]`, etc.

## Installation

### NPM

```bash
npm install -g reviewprompt
```

### PNPM

```bash
pnpm add -g reviewprompt
```

### Yarn

```bash
yarn global add reviewprompt
```

## Setup

### GitHub Authentication

ReviewPrompt requires GitHub authentication to access PR comments. Set up authentication using one of these methods:

#### GitHub CLI（Recommended）

If you have [GitHub CLI](https://cli.github.com/) installed and authenticated:

```bash
gh auth login
```

ReviewPrompt will automatically use your GitHub CLI credentials.

#### Personal Access Token

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` scope
2. Set the environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

## Usage

### Basic Usage

```bash
reviewprompt https://github.com/owner/repo/pull/123
```

This will:
1. Fetch all review comments from the PR
2. Filter comments containing `[ai]` mention
3. Display the generated prompt

### Interactive Mode

```bash
reviewprompt https://github.com/owner/repo/pull/123 --interactive
```

Select specific comments to include in your prompt using an interactive interface.

### Custom Mentions

Use custom mention patterns:

```bash
reviewprompt https://github.com/owner/repo/pull/123 --mention "[bot]"
reviewprompt https://github.com/owner/repo/pull/123 --mention "@custom"
```

### Copy to Clipboard

```bash
reviewprompt https://github.com/owner/repo/pull/123 --clipboard
```

### Resolve Comments After Processing

```bash
reviewprompt https://github.com/owner/repo/pull/123 --resolve
```

### Delete Comments After Processing

```bash
reviewprompt https://github.com/owner/repo/pull/123 --delete
```

## Commands

### Main Command

```bash
reviewprompt <pr-url> [options]
```

**Options:**
- `-i, --interactive` - Run in interactive mode to select specific comments
- `-r, --resolve` - Resolve comments after building prompt
- `-d, --delete` - Delete comments after building prompt  
- `-m, --mention <mention>` - Custom mention to filter (default: `[ai]`)
- `-c, --clipboard` - Copy output to clipboard

### Resolve Command

Resolve comments containing the specified mention:

```bash
reviewprompt resolve <pr-url> [options]
```

**Options:**
- `-a, --all` - Resolve all comments without interactive mode
- `-m, --mention <mention>` - Custom mention to filter (default: `[ai]`)

### Delete Command

Delete comments containing the specified mention:

```bash
reviewprompt delete <pr-url> [options]
```

**Options:**
- `-a, --all` - Delete all comments without interactive mode
- `-m, --mention <mention>` - Custom mention to filter (default: `[ai]`)

## Examples

### Basic Workflow

1. **Add mention to PR comments**: When reviewing code, add `[ai]` to comments you want AI assistance with:
   ```
   [ai] This function needs error handling for edge cases
   ```

2. **Generate prompt**: Run reviewprompt to collect and format these comments:
   ```bash
   reviewprompt https://github.com/myorg/myproject/pull/456 --clipboard
   ```

3. **Use with AI**: Paste the generated prompt into your preferred AI assistant

4. **Clean up**: Resolve processed comments:
   ```bash
   reviewprompt resolve https://github.com/myorg/myproject/pull/456 --all
   ```

### Team Workflow

Use different mentions for different team members or purposes:

```bash
# For senior dev review
reviewprompt https://github.com/myorg/myproject/pull/456 --mention "[senior]"

# For security review  
reviewprompt https://github.com/myorg/myproject/pull/456 --mention "[security]"

# For performance optimization
reviewprompt https://github.com/myorg/myproject/pull/456 --mention "[perf]"
```

## Output Format

ReviewPrompt generates structured prompts with file context:

```
./src/utils/auth.ts:L15
Add input validation for the email parameter

./src/components/UserProfile.tsx:L45-L50  
This component should handle loading states better

./src/api/users.ts:L23
Consider adding rate limiting to this endpoint
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MIT - see [LICENSE](./LICENSE) for details.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/dyoshikawa/reviewprompt/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/dyoshikawa/reviewprompt/issues)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/dyoshikawa/reviewprompt/wiki)