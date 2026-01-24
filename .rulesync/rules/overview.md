---
root: true
targets: ['*']
description: "reviewprompt project overview and architecture guide"
globs: ["**/*"]
---

# ReviewPrompt CLI Tool

ReviewPrompt is a GitHub PR review comment aggregation CLI tool that extracts AI-targeted review comments and converts them into structured prompts for AI coding assistants.

## Project Overview

**Name**: reviewprompt  
**Version**: 0.12.0  
**License**: MIT  
**Purpose**: GitHub PR review comment aggregation CLI tool that extracts AI-targeted review comments and converts them into structured prompts for AI coding assistants

## Architecture

### Core Components

#### CLI Layer (`src/cli/`)
- **index.ts**: Main CLI entry point using Commander.js with three primary commands
- **commands/main.ts**: Primary command for extracting and building prompts from PR comments
- **commands/resolve.ts**: Command for marking comments as resolved
- **commands/delete.ts**: Command for deleting comments

#### GitHub Integration (`src/lib/`)
- **github.ts**: GitHubClient class handling Octokit REST API interactions
- **comment.ts**: Comment filtering and processing logic
- **types.ts**: TypeScript type definitions for PR comments, CLI options, and data structures

#### UI Components (`src/components/`)
- **CommentSelector.tsx**: React component for interactive comment selection using ink

#### Utilities (`src/utils/`)
- **clipboard.ts**: Clipboard operations for copying generated prompts
- **prompt.ts**: Prompt generation and formatting utilities
- **auth.ts**: Authentication utilities for GitHub token management

### Key Features

1. **Comment Extraction**: Fetches PR review comments containing specified mentions (default: `[ai]`)
2. **Interactive Mode**: Allows users to select specific comments via a TUI interface
3. **Prompt Generation**: Converts selected comments into structured AI prompts with file context
4. **Comment Management**: Can resolve or delete processed comments
5. **Clipboard Integration**: Copies generated prompts to system clipboard

### Technology Stack

- **Runtime**: Node.js (>=20.0.0)
- **Language**: TypeScript
- **CLI Framework**: Commander.js
- **UI Framework**: React + ink (for TUI components)
- **GitHub API**: Octokit GraphQL and REST
- **Build Tool**: tsup
- **Package Manager**: pnpm
- **Testing**: Vitest
- **Linting**: Biome, ESLint, oxlint

### Data Flow

1. Parse GitHub PR URL to extract owner/repo/PR number
2. Authenticate with GitHub API using token
3. Fetch all review comments from the PR
4. Filter comments containing the specified mention
5. Present comments for selection (interactive mode) or process all
6. Generate structured prompt from selected comments
7. Output to console or clipboard
8. Optionally resolve/delete processed comments

### Configuration

- **Authentication**: Supports both GitHub Personal Access Token (`GITHUB_TOKEN` env var) and GitHub CLI authentication
- **Mention Filtering**: Configurable mention patterns (default: `[ai]`)
- **Output Modes**: Console display or direct clipboard copy
- **Processing Modes**: Interactive selection (default) or batch processing with `--all` flag
- **Comment Actions**: View, resolve, or delete comments after processing

### Entry Points

- **Binary**: `reviewprompt` command
- **Main module**: `dist/index.js`
- **Development**: `tsx src/cli/index.ts`
