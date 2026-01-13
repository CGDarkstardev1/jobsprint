# Auto-Commit/Push System Documentation

This document describes the automatic commit and push system implemented in JobSprint.

## Overview

JobSprint includes an automatic commit and push system that:

- Automatically pushes commits to `origin/master` after each commit
- Provides convenient npm scripts for common git operations
- Includes a FileTimelineTracker integration for monitoring

## Features

### 1. Post-Commit Auto-Push

A git hook (`.git/hooks/post-commit`) automatically pushes commits to `origin/master` after each commit.

**Behavior:**

- Pushes only on `master` or `main` branch
- Can be skipped by including `[no-push]` in the commit message
- Notifies the FileTimelineTracker for drift tracking
- Runs silently in the background

**Example:**

```bash
# This will auto-push
git commit -m "feat: add new feature"

# This will NOT auto-push
git commit -m "feat: add new feature [no-push]"
```

### 2. NPM Scripts

The following npm scripts are available in `package.json`:

| Script                | Description                          | Usage                                |
| --------------------- | ------------------------------------ | ------------------------------------ |
| `npm run commit`      | Commit all changes with auto-push    | `npm run commit "Your message"`      |
| `npm run commit:msg`  | Stage and commit with custom message | `npm run commit:msg "Your message"`  |
| `npm run push`        | Push to origin/master                | `npm run push`                       |
| `npm run commit:push` | Commit and push (same as commit)     | `npm run commit:push "Your message"` |
| `npm run sync`        | Pull and push                        | `npm run sync`                       |

### 3. Shell Script

A standalone shell script is also available:

```bash
# Commit all changes with auto-push
./scripts/auto-commit.sh "Your commit message"

# Uses default timestamp message if no message provided
./scripts/auto-commit.sh
```

## Files

- `.git/hooks/post-commit` - Git hook for auto-push
- `scripts/auto-commit.sh` - Standalone commit script
- `package.json` - NPM scripts configuration

## Configuration

### Skip Auto-Push

To skip auto-push for a specific commit, include `[no-push]` in the commit message:

```bash
git commit -m "WIP: work in progress [no-push]"
```

### Manual Push

If you need to push manually (e.g., on a different branch):

```bash
git push origin <branch-name>
```

## Troubleshooting

### Push Fails

If auto-push fails, you'll see an error message. Common causes:

1. **Remote has new commits**: Run `git pull` first
2. **Authentication issues**: Check git credentials
3. **Branch protection**: Verify branch protection rules

### Hook Not Executing

Ensure the hook is executable:

```bash
chmod +x .git/hooks/post-commit
```

### Wrong Branch

Auto-push only happens on `master` or `main`. On other branches, you'll see a warning message.

## Integration with FileTimelineTracker

The post-commit hook also notifies the FileTimelineTracker (used by auto-claude) when human commits are made. This enables drift tracking between human and AI contributions.

## Best Practices

1. **Use descriptive commit messages**: The autocommit system doesn't enforce message format, but follow conventional commits
2. **Pull before push**: If working with others, run `npm run sync` occasionally
3. **Review before commit**: The autocommit system commits all staged changes - review `git status` first

## Git Status Commands

```bash
# Check current status
git status

# View pending commits
git log origin/master..HEAD

# View recent commits
git log --oneline -10

# Check ahead/behind
git status -sb
```
