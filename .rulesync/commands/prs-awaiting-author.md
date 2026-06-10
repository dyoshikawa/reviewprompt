---
targets:
  - "*"
description: List open PRs where the ball is in the author's court
---

# PRs Awaiting Author

List open pull requests that are waiting on the **author** to act (for example,
changes requested, CI failing, or unresolved review comments).

The maintainers for this repository are `dyoshikawa` and `cm-dyoshikawa`.

## Step 1: List Open PRs

```bash
gh pr list --state open --json number,title,author,reviewDecision,isDraft,statusCheckRollup,updatedAt --limit 100
```

## Step 2: Determine Who Holds the Ball

A PR is **awaiting the author** when any of the following is true:

- `reviewDecision` is `CHANGES_REQUESTED`.
- CI/status checks are failing (`statusCheckRollup`).
- The PR is a draft (`isDraft` is true).

PRs authored by the maintainers (`dyoshikawa` / `cm-dyoshikawa`) that are simply
waiting for review are **not** in this list — those are awaiting the maintainer.

## Step 3: Report Result

Output a table: PR number, title, author, reason it is awaiting the author, and
last-updated time, sorted by least-recently-updated first.
