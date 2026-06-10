---
description: Review a PR and then post the findings as line-level comments
---

# Review and Comment

target_pr = $ARGUMENTS

If `target_pr` is not provided, use the PR of the current branch.

This command chains two steps: review the PR, then post the findings as
line-level review comments.

## Step 1: Review the PR

Follow the `review-pr` command to review `$target_pr` for code quality and
security issues. Collect the findings with their severity (low / mid / high /
critical) and the file/line each one refers to.

## Step 2: Post the Findings

Follow the `post-review-comments` command to post each finding as a line-level
comment on `$target_pr`.

## Step 3: Report Result

Output the PR number and a summary of the findings and comments posted.
