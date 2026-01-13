#!/bin/bash
# ============================================
# auto-commit.sh - Commit all changes with auto-push
# Usage: ./scripts/auto-commit.sh "Your commit message"
# ============================================

set -e

COMMIT_MSG="${1:-"$(date +'%Y-%m-%d %H:%M:%S') - Automated update"}"

echo "📝 Committing all changes..."
echo "   Message: $COMMIT_MSG"

# Add all changes
git add -A

# Commit with the message
git commit -m "$COMMIT_MSG"

echo "✅ Commit created successfully"

# The post-commit hook will handle the push
echo "🚀 Post-commit hook will auto-push..."
