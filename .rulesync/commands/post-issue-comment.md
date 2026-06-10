---
targets:
  - "*"
description: Post a natural-language reply to a GitHub issue
---

# Post Issue Comment

target_issue = $ARGUMENTS

If `target_issue` is not provided, **ask the user** which issue to comment on.

## Step 1: Read the Issue

```bash
gh issue view <target_issue> --json title,body,comments
```

Understand the current state of the discussion before replying.

## Step 2: Draft the Comment

Write the comment in natural English. Keep it clear, friendly, and specific to
the discussion. Confirm the draft with the user before posting if there is any
ambiguity about intent.

## Step 3: Post

```bash
gh issue comment <target_issue> --body "<comment>"
```

## Step 4: Report Result

Output the issue URL and the posted comment.
