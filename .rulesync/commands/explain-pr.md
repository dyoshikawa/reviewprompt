---
targets:
  - "*"
description: Explain the background and intent of a pull request
---

# Explain Pull Request

target_pr = $ARGUMENTS

If `target_pr` is not provided, use the PR of the current branch.

## Important: Do Not Switch the Local Branch

Inspect the PR with read-only commands; do not check out or switch the branch:

```bash
gh pr view <target_pr> --json title,body,files,commits
gh pr diff <target_pr>
```

## Step 1: Understand the Change

Review the description, commits, and diff to understand the intent.

## Step 2: Explain

Produce a clear explanation covering:

- **Background**: the problem this PR addresses.
- **What changed**: the key changes grouped by area/module.
- **Impact / risks**: behavioral changes, migration notes, and follow-ups.

## Step 3: Report Result

Output the explanation and the PR number. Do not modify any files.
