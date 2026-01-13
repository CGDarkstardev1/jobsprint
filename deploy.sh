#!/bin/bash
#
# JobSprint Deployment Script
# 
# Usage: ./deploy.sh [--subdomain <name>]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
SUBDOMAIN="${1:-jobsprint-app}"

echo "🚀 JobSprint Deployment"
echo "======================"
echo ""

# Build
echo "🔨 Building application..."
mkdir -p "$DIST_DIR/js/services" "$DIST_DIR/js/utils" "$DIST_DIR/css"

cp "$SCRIPT_DIR/src/frontend/index.html" "$DIST_DIR/"
cp "$SCRIPT_DIR/src/frontend/css/main.css" "$DIST_DIR/css/"
cp "$SCRIPT_DIR/src/frontend/js/main.js" "$DIST_DIR/js/"
cp "$SCRIPT_DIR/src/frontend/js/services/"*.js "$DIST_DIR/js/services/" 2>/dev/null || true
cp "$SCRIPT_DIR/src/frontend/js/utils/"*.js "$DIST_DIR/js/utils/" 2>/dev/null || true

echo "✅ Build complete: $DIST_DIR"
echo ""

# Check puter CLI
if ! command -v puter &> /dev/null; then
    echo "📦 Installing puter-cli..."
    npm install -g puter-cli
fi

# Check login
if [ -f "$HOME/.config/puter-cli/config.json" ]; then
    echo "✅ Puter CLI installed and logged in"
    echo ""
    echo "🌐 To deploy, run these commands:"
    echo ""
    echo "   puter"
    echo "   > site:deploy $DIST_DIR --subdomain=$SUBDOMAIN"
    echo "   > quit"
    echo ""
    echo "Or use drag-and-drop:"
    echo "   1. Go to https://puter.com"
    echo "   2. Drag 'dist' folder to Puter desktop"
    echo "   3. Right-click → 'Publish as Website'"
    echo ""
    echo "Your site will be at: https://${SUBDOMAIN}.puter.site"
else
    echo "📝 To deploy, first login:"
    echo ""
    echo "   puter"
    echo "   > login --save"
    echo "   > quit"
    echo ""
    echo "Then deploy:"
    echo "   puter"
    echo "   > site:deploy $DIST_DIR --subdomain=$SUBDOMAIN"
    echo "   > quit"
fi

echo ""
echo "✅ Done! Files ready in: $DIST_DIR"
