---
targets:
  - "*"
description: "Commit current changes and push to remote (pushing directly to main is allowed)"
---

# Commit and Push

## Step 1: Check Current Branch

Run `git branch --show-current` to get the current branch name.

Unlike the `commit-push-pr` command, this command does **not** require a feature
branch. Pushing directly to `main` (or `master`) is allowed, so do not create a
new branch automatically. Use the current branch as-is.

## Step 2: Stage and Commit Changes

1. Run `git status` to check for changes
2. If there are unstaged changes, stage them: `git add .`
3. Analyze the changes and create a meaningful commit message
4. Commit with: `git commit -m "<commit-message>"`

## Step 3: Push to Remote

Push the current branch to remote with upstream tracking:

```bash
git push -u origin <branch-name>
```

This works for any branch, including `main` or `master`.

## Step 4: Report Result

Output the pushed branch name and a summary of actions taken.
