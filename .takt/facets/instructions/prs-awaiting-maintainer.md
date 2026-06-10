# PRs Awaiting Maintainer

List open pull requests that are waiting on a **maintainer** to act (for
example, ready for review with passing CI and no changes requested).

The maintainers for this repository are `dyoshikawa` and `cm-dyoshikawa`.

## Step 1: List Open PRs

```bash
gh pr list --state open --json number,title,author,reviewDecision,isDraft,statusCheckRollup,updatedAt --limit 100
```

## Step 2: Determine Who Holds the Ball

A PR is **awaiting the maintainer** when all of the following are true:

- It is not a draft (`isDraft` is false).
- CI/status checks are passing (or not yet failing).
- `reviewDecision` is not `CHANGES_REQUESTED` (i.e. it is `REVIEW_REQUIRED`,
  `APPROVED` and awaiting merge, or no decision yet).

Use `author_association` (`OWNER` / `MEMBER` / `COLLABORATOR`) to recognize
maintainer-authored PRs when needed.

## Step 3: Report Result

Output a table: PR number, title, author, why it is awaiting the maintainer
(needs review / approved and ready to merge), and last-updated time, sorted by
least-recently-updated first.
