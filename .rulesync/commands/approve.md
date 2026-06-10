---
targets:
  - "*"
description: Approve a pull request with gh pr review --approve
---

# Approve Pull Request

## Step 1: Determine the Target PR

Parse `$ARGUMENTS`. If a PR number or URL is provided, use it. Otherwise use the
PR associated with the current branch:

```bash
gh pr view --json number,title,state
```

If the PR cannot be determined, **ask the user** which PR to approve.

## Step 2: Approve

```bash
gh pr review <pr_number> --approve
```

Optionally pass a short approval message with `--body "<message>"`.

## Step 3: Report Result

Output the approved PR number and title.
