---
description: Switch to the default branch and pull the latest changes
---

# Pull Latest Main

## Step 1: Switch to the Default Branch

```bash
git switch main
```

If the working tree has uncommitted changes, **stop and ask the user** how to
proceed (stash, commit, or discard) before switching.

## Step 2: Pull and Prune

```bash
git pull --prune
```

`--prune` removes local references to remote branches that have been deleted.

## Step 3: Report Result

Output the current `HEAD` commit and a short summary of what was pulled.
