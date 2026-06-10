# Explain Issue

target_issue = $ARGUMENTS

If `target_issue` is not provided, **ask the user** which issue to explain.

## Step 1: Fetch the Issue

```bash
gh issue view <target_issue> --json title,body,labels,comments
```

## Step 2: Investigate Context

Investigate the relevant code and discussion to understand the problem:

- Which files/modules are affected.
- Related patterns, prior art, and constraints.

## Step 3: Explain

Produce a clear explanation covering:

- **Background**: what the issue is asking for and why.
- **Root cause / context**: the relevant code and constraints.
- **Proposed solution**: a concrete approach, with alternatives if relevant.

## Step 4: Report Result

Output the explanation. Do not modify any files.
