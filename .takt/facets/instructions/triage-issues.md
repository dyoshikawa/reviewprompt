# Triage Issues

## Step 1: Find Unlabeled Open Issues

```bash
gh issue list --state open --search "no:label" --json number,title,body --limit 100
```

## Step 2: Fetch the Available Labels

```bash
gh label list
```

Only use labels that actually exist in the repository.

## Step 3: Classify Each Issue

Read each issue and assign the labels that fit. The repository's standard
labels and their meaning:

- `bug` — something isn't working as intended.
- `enhancement` — a new feature or request.
- `documentation` — improvements or additions to documentation.
- `question` — further information is requested.
- `duplicate` — already tracked by another issue or PR.
- `invalid` — does not seem to be a real/actionable issue.
- `wontfix` — acknowledged but will not be worked on.
- `good first issue` — small, approachable task suitable for newcomers.
- `help wanted` — extra attention or external help is welcome.

Add `good first issue` only when the task is genuinely small and well-scoped.

## Step 4: Apply Labels

```bash
gh issue edit <issue_number> --add-label "<label1>,<label2>"
```

## Step 5: Report Result

Output a table of issues and the labels applied to each.
