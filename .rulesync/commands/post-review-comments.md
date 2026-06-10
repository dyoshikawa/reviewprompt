---
targets:
  - "*"
description: Post line-level review comments to a pull request
---

# Post Review Comments

target_pr = $ARGUMENTS

If `target_pr` is not provided, use the PR of the current branch. This command
expects a set of review findings (for example, the output of `review-pr`).

## Important: Do Not Switch the Local Branch

Inspect the PR with read-only commands; do not check out or switch the branch.

## Step 1: Map Findings to Locations

For each finding, determine the file path and line number in the PR diff:

```bash
gh pr diff <target_pr>
gh pr view <target_pr> --json files
```

## Step 2: Post Line-Level Comments

Create a review with line-level comments via the GitHub API:

```bash
gh api repos/<owner>/<repo>/pulls/<target_pr>/comments \
  -f body="<comment>" -f commit_id="<head_sha>" -f path="<file>" -F line=<line>
```

Get the head SHA with `gh pr view <target_pr> --json headRefOid --jq '.headRefOid'`.

Each comment should clearly state the issue, its severity (low / mid / high /
critical), and a suggested fix.

## Step 3: Report Result

Output the PR number and a summary of the comments posted.
