# Installation Guide - n8n-nodes-jobsprint

## Quick Start

### Option 1: Install from npm (Recommended)

1. Open n8n interface
2. Go to **Settings** > **Community Nodes**
3. Click **Add**
4. Search for `n8n-nodes-jobsprint`
5. Click **Install**
6. Restart n8n if prompted

### Option 2: Install from Source

```bash
# Navigate to the custom nodes directory
cd /home/chris/dev/jobsprint/src/backend/n8n-custom-nodes

# Install dependencies
npm install

# Build the nodes
npm run build

# Link to n8n (if developing locally)
npm link

# In n8n installation directory
npm link n8n-nodes-jobsprint
```

## Development Setup

### Prerequisites

- Node.js >= 18.10
- npm >= 9.0.0
- TypeScript 5.3.3

### Installation Steps

```bash
# Clone repository
git clone https://github.com/jobsprint/n8n-nodes-jobsprint.git
cd n8n-nodes-jobsprint

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Watch mode for development
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- JobsprintAI.test.ts
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck
```

## Configuration

### 1. Set up Credentials

1. In n8n, create a new credential:
   - **Type**: Jobsprint API
   - **API URL**: `https://api.jobsprint.ai` (or your custom URL)
   - **API Key**: Your Jobsprint API key

2. Test the credential to verify connectivity

### 2. Import Workflow Templates

The package includes 5 workflow templates:

1. **AI Content Generator** - Generate content with AI
2. **Email to Slack Summarizer** - Summarize emails and post to Slack
3. **File Processor with AI** - Process uploaded files with AI
4. **Multi-Step Workflow Automation** - Complex multi-service automation
5. **Scheduled Report Generator** - Daily AI-powered reports

To import:
1. Go to **Workflows** in n8n
2. Click **Import from File**
3. Select `examples/workflow-templates.json`

### 3. Test the Installation

Create a simple test workflow:

```
Jobsprint AI Node → Set Node
```

**AI Node Configuration:**
```json
{
  "operation": "chat",
  "model": "gpt-3.5-turbo",
  "messages": {
    "messages": [
      {
        "role": "user",
        "content": "Hello, Jobsprint!"
      }
    ]
  },
  "maxTokens": 100,
  "temperature": 0.7
}
```

Execute the workflow and verify you get a response.

## Building for Production

```bash
# Clean build artifacts
npm run clean

# Run full build
npm run build

# Verify build
ls -la dist/

# Run tests after build
npm test

# Check bundle size
du -sh dist/
```

## Deployment

### Docker Deployment

If running n8n in Docker:

```dockerfile
FROM n8nio/n8n:latest

# Install custom nodes
RUN npm install n8n-nodes-jobsprint

# Or copy from local build
COPY ./n8n-nodes-jobsprint /custom-nodes
RUN cd /custom-nodes && npm install && npm run build
```

### Environment Variables

```bash
# n8n Configuration
N8N_COMMUNITY_PACKAGES_ENABLED=true
N8N_ENABLED_NODES="JobsprintAI,JobsprintPuterStorage,JobsprintZapier,JobsprintWorkflowTrigger,JobsprintWebhookHandler"

# Jobsprint API
JOBSPRINT_API_URL=https://api.jobsprint.ai
JOBSPRINT_API_KEY=your-api-key-here
```

## Troubleshooting

### Node Not Showing Up

1. Verify installation: `npm list n8n-nodes-jobsprint`
2. Restart n8n completely
3. Clear n8n cache: `rm -rf ~/.n8n`
4. Check n8n logs for errors

### Build Errors

```bash
# Clean everything
npm run clean
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

### Test Failures

```bash
# Update dependencies
npm update

# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

### Type Errors

```bash
# Regenerate type definitions
npm run typecheck

# Update TypeScript
npm install -D typescript@latest

# Check for conflicts
npm ls typescript
```

## Uninstallation

```bash
# Remove package
npm uninstall n8n-nodes-jobsprint

# Or unlink if using local development
npm unlink -g n8n-nodes-jobsprint

# Clean n8n cache
rm -rf ~/.n8n
```

## Support

- **Documentation**: https://jobsprint.ai/docs
- **Issues**: https://github.com/jobsprint/n8n-nodes-jobsprint/issues
- **Discussions**: https://github.com/jobsprint/n8n-nodes-jobsprint/discussions
- **Email**: support@jobsprint.ai

## Next Steps

1. Read the [README.md](./README.md) for usage examples
2. Check [docs/AI-NODE.md](./docs/AI-NODE.md) for AI node documentation
3. Review [examples/workflow-templates.json](./examples/workflow-templates.json) for inspiration
4. Join the community Discord for support and discussions
