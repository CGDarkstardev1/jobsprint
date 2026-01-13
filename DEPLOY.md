# JobSprint Deployment Guide

## Quick Deploy (One Command)

```bash
./deploy.sh
```

That's it! The script will:

1. ✅ Check prerequisites (Node.js, Puter CLI)
2. 🔨 Build the application
3. 🔐 Prompt for Puter.js login if needed
4. 🌐 Deploy to https://jobsprint-app.puter.site

## Options

```bash
./deploy.sh --subdomain myjobs       # Custom subdomain
./deploy.sh --build-only             # Build only, don't deploy
./deploy.sh --help                   # Show help
```

## After Deployment

1. **Open your app**: https://your-subdomain.puter.site
2. **Configure AI features**: Go to Settings → Add your Anthropic API key
3. **Start using JobSprint**:
   - Search jobs across multiple platforms
   - Tailor your resume with AI
   - Check ATS compatibility
   - Auto-apply to jobs

## Manual Deployment (Drag & Drop)

If the CLI doesn't work:

1. Go to https://puter.com
2. Sign in or create account
3. Drag the `dist` folder to your Puter desktop
4. Right-click the uploaded folder
5. Select "Publish as Website"
6. Choose a subdomain and click "Publish"

## File Structure

```
jobsprint/
├── dist/                    # Built static files (ready to deploy)
│   ├── index.html          # Main entry point
│   ├── css/main.css        # Styles
│   └── js/
│       ├── main.js         # Application logic
│       ├── services/       # Core services
│       └── utils/          # Utilities
├── deploy.sh               # One-command deployment script
├── deploy-to-puter.html    # Browser-based deployment helper
└── src/                    # Source code
```

## Features Included

- 🔍 **Multi-platform job search** (LinkedIn, Indeed, Glassdoor, RemoteOK)
- 📝 **AI Resume Tailoring** using Claude
- ✅ **ATS Compatibility Check**
- 🤖 **Auto-Apply Workflow** with stealth browser
- 🎨 **Modern Web UI**
- 🔒 **Stealth Mode** (human-like behavior)

## Requirements

- Node.js 18+
- Puter.js account (free at puter.com)
- Optional: Anthropic API key for AI features
