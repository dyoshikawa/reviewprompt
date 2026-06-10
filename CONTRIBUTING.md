# Contributing to ReviewPrompt

Thank you for your interest in contributing to ReviewPrompt! This guide will help you set up your development environment and understand our contribution workflow.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **Package Manager**: We use [pnpm](https://pnpm.io/) for dependency management
- **Git**: For version control

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/dyoshikawa/reviewprompt.git
   cd reviewprompt
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up Git hooks**:
   ```bash
   pnpm run prepare
   ```

### Environment Configuration

1. **GitHub Authentication**: Set up a GitHub token for testing:

   ```bash
   export GITHUB_TOKEN=your_development_token_here
   ```

2. **Development Tools**: The project includes several development tools configured via:
   - `.oxlintrc.json` - oxlint (linting) configuration
   - `.oxfmtrc.json` - oxfmt (formatting) configuration
   - `tsconfig.json` - TypeScript configuration
   - `vitest.config.ts` - Test configuration

## Development Workflow

### Available Scripts

```bash
# Development
pnpm dev                 # Run CLI in development mode with tsx
pnpm build              # Build the project
pnpm test               # Run tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Run tests with coverage report

# Code Quality
pnpm cicheck            # Run all quality checks (code + content)
pnpm cicheck:code       # Format check, lint, type check, and tests
pnpm cicheck:content    # Spell check and secret scan
pnpm check              # Format check, lint, and type check
pnpm fix                # Auto-fix formatting and lint issues
pnpm typecheck          # TypeScript type checking

# Individual tools
pnpm fmt                # Format with oxfmt
pnpm fmt:check          # Check formatting with oxfmt
pnpm oxlint             # Lint with oxlint
pnpm cspell             # Spell checking
pnpm secretlint         # Secret scanning
```

### Running the CLI Locally

```bash
# Using the dev script (recommended for development)
pnpm dev https://github.com/owner/repo/pull/123

# Using the built version
pnpm build
node dist/index.js https://github.com/owner/repo/pull/123
```

### Testing

We use [Vitest](https://vitest.dev/) for testing. Tests are located alongside source files with `.test.ts` extension.

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode during development
pnpm test:watch

# Run specific test file
pnpm vitest src/lib/comment.test.ts
```

### Code Quality Standards

We maintain high code quality standards using multiple tools:

- **oxfmt**: Code formatter
- **oxlint**: Fast linter for common issues
- **TypeScript**: Strict type checking
- **CSpell**: Spell checking in code and comments
- **Secretlint**: Prevents committing secrets

All quality checks must pass before merging:

```bash
pnpm cicheck  # Runs all quality checks
```

## Project Structure

```
src/
├── cli/
│   ├── commands/          # Command implementations
│   │   ├── main.ts       # Main command logic
│   │   ├── resolve.ts    # Resolve command
│   │   ├── delete.ts     # Delete command
│   │   └── *.test.ts     # Command tests
│   └── index.ts          # CLI entry point
├── components/
│   └── CommentSelector.tsx # Interactive comment selection UI
├── lib/
│   ├── comment.ts        # Comment processing logic
│   ├── github.ts         # GitHub API interactions
│   ├── types.ts          # Type definitions
│   └── *.test.ts         # Unit tests
└── utils/
    ├── auth.ts           # Authentication helpers
    ├── clipboard.ts      # Clipboard operations
    ├── prompt.ts         # Prompt generation
    └── *.test.ts         # Utility tests
```

## Contributing Guidelines

### Submitting Changes

1. **Fork the repository** and create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow existing code patterns and conventions
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**:

   ```bash
   pnpm cicheck    # Run all quality checks (lint, types, tests, spelling, secrets)
   ```

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style Guidelines

1. **TypeScript**: Use strict typing, avoid `any` when possible
2. **Formatting**: Automatic via oxfmt (runs on pre-commit)
3. **Naming**: Use descriptive names for functions and variables
4. **Comments**: Add JSDoc comments for public APIs
5. **Imports**: Use relative imports within the project

### Adding New Features

When adding new features:

1. **Types**: Update `src/lib/types.ts` for new data structures
2. **Tests**: Add comprehensive tests including edge cases
3. **Documentation**: Update README.md if user-facing changes
4. **CLI**: Update help text and command descriptions

### Common Development Tasks

#### Adding a New Command

1. Create command file in `src/cli/commands/`
2. Add command tests
3. Register command in `src/cli/index.ts`
4. Update types in `src/lib/types.ts` if needed

#### Modifying GitHub API Interactions

1. Update `src/lib/github.ts`
2. Add/update tests in `src/lib/github.test.ts`
3. Update types if the API response structure changes

#### Changing Comment Processing

1. Modify `src/lib/comment.ts`
2. Update tests in `src/lib/comment.test.ts`
3. Ensure integration tests still pass

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update CHANGELOG.md (if present)
3. Create git tag
4. Publish to npm

## Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/dyoshikawa/reviewprompt/discussions)
- **Bug Reports**: Create a [GitHub Issue](https://github.com/dyoshikawa/reviewprompt/issues)
- **Feature Requests**: Create a [GitHub Issue](https://github.com/dyoshikawa/reviewprompt/issues) with the enhancement label

## Code of Conduct

Please be respectful and constructive in all interactions. We're building this tool together to help developers work more effectively with AI assistants.

Thank you for contributing to ReviewPrompt! 🚀
