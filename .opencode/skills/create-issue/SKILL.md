---
name: create-issue
description: >-
  Create a GitHub issue with a detailed description, purpose, and appropriate
  labels
---

# Create GitHub Issue

## Step 1: Gather Information

Receive the topic from `$ARGUMENTS`. If it is insufficient, ask for: what needs
to be done (the task or problem) and why (the purpose or motivation).

## Step 2: Research Context

Investigate the relevant code: affected files/modules, related patterns, and the
likely impact of the change.

## Step 3: Draft the Issue

All issue content (title, body, labels) must be written in English.

```markdown
## Summary

A concise one-liner.

## Motivation / Purpose

Why this change is needed.

## Details

- Specific changes required
- Files/modules likely affected
- Acceptance criteria / expected behavior

## Additional Context

Links, screenshots, references (if applicable).
```

## Step 4: Assign Labels

Run `gh label list`, then choose from the existing labels only. Add
`good first issue` if the task is small and approachable and that label exists.

## Step 5: Create

```bash
gh issue create --title "<title>" --body "<body>" --label "<l1>,<l2>"
```

## Step 6: Report Result

Output the issue URL, title, and assigned labels.
