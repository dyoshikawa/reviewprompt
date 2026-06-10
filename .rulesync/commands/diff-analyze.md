---
targets:
  - "*"
description: Summarize the diff between the current branch and origin/main
---

# Analyze Diff Against origin/main

## Step 1: Refresh the Base Reference

```bash
git fetch origin main
```

## Step 2: Inspect the Diff

```bash
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

The three-dot form compares the current branch against the common ancestor with
`origin/main`, so unrelated changes already on `main` are excluded.

## Step 3: Summarize

Produce a concise summary covering:

- The overall intent of the changes.
- Notable additions, modifications, and removals grouped by area/module.
- Any risks, follow-ups, or missing test coverage you notice.

## Step 4: Report Result

Output the summary. Do not modify any files.
