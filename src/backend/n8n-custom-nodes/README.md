# n8n-nodes-jobsprint

Jobsprint custom nodes for n8n - AI automation platform integration.

## Features

This package provides 5 custom n8n nodes for integrating with the Jobsprint AI automation platform:

### 1. **Jobsprint AI** (`JobsprintAI`)
- Access free AI models through Puter.js integration
- Supports GPT-3.5-turbo, Code-Davinci, and Text-Davinci
- Operations: Chat completion, code completion, text completion
- Configurable parameters: max tokens, temperature, top p, frequency/presence penalty

### 2. **Jobsprint Puter Storage** (`JobsprintPuterStorage`)
- Cloud storage operations through Puter.js
- File operations: upload, download, delete, get metadata
- Folder operations: create, list, delete
- Support for multiple encodings (UTF-8, Base64)

### 3. **Jobsprint Zapier** (`JobsprintZapier`)
- Access 30,000+ Zapier app integrations through MCP
- Dynamic loading of apps, actions, and triggers
- Operations: actions, triggers, webhook handling
- Flexible parameter mapping

### 4. **Jobsprint Workflow Trigger** (`JobsprintWorkflowTrigger`)
- Trigger workflows on various events
- Schedule triggers with cron expressions
- Event-based triggers (file operations, AI jobs, workflows)
- Webhook triggers with customizable responses
- Manual triggers via API

### 5. **Jobsprint Webhook Handler** (`JobsprintWebhookHandler`)
- Handle incoming webhook requests
- Multiple authentication methods (API key, bearer token, basic auth, custom headers)
- Response modes: immediate or last node
- Configurable parsing and output options

## Installation

1. In n8n, go to **Settings** > **Community Nodes**
2. Click **Add** and search for `n8n-nodes-jobsprint`
3. Click **Install** on the package
4. Restart n8n if required

Alternatively, install via CLI:

```bash
npm install n8n-nodes-jobsprint
```

## Configuration

### Credentials

All nodes require Jobsprint API credentials:

1. Click **Add New Credential** in any Jobsprint node
2. Select **Jobsprint API**
3. Enter:
   - **API URL**: Base URL for Jobsprint API (default: `https://api.jobsprint.ai`)
   - **API Key**: Your Jobsprint API key

### Node Setup Examples

#### AI Chat Completion

```json
{
  "operation": "chat",
  "model": "gpt-3.5-turbo",
  "messages": {
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello, how can you help me?"
      }
    ]
  },
  "maxTokens": 1000,
  "temperature": 0.7
}
```

#### File Upload

```json
{
  "resource": "file",
  "operation": "upload",
  "filePath": "/my-files/document.txt",
  "fileContent": "Hello, world!",
  "encoding": "utf8"
}
```

#### Zapier Action

```json
{
  "resource": "action",
  "app": "slack",
  "action": "sendMessage",
  "parameters": {
    "parameters": [
      {
        "name": "channel",
        "value": "#general"
      },
      {
        "name": "text",
        "value": "Hello from Jobsprint!"
      }
    ]
  }
}
```

#### Schedule Trigger

```json
{
  "triggerType": "schedule",
  "cronExpression": "0 * * * *"
}
```

#### Webhook Handler

```json
{
  "httpMethod": "POST",
  "path": "my-webhook",
  "authentication": "apiKey",
  "apiKey": "your-secret-api-key",
  "responseMode": "lastNode"
}
```

## Usage Examples

### Example 1: AI-Powered File Processing

```
Webhook Handler → Puter Storage (Download) → Jobsprint AI → Puter Storage (Upload)
```

1. Receive file path via webhook
2. Download file from Puter storage
3. Process content with AI
4. Upload result back to storage

### Example 2: Zapier Integration

```
Schedule Trigger → Zapier (Gmail Trigger) → Jobsprint AI → Zapier (Slack Action)
```

1. Trigger every hour
2. Check Gmail for new emails
3. Summarize with AI
4. Post summary to Slack

### Example 3: Event-Based Workflow

```
Workflow Trigger (Event) → Jobsprint AI → Multiple Zapier Actions
```

1. Listen for file creation events
2. Analyze file with AI
3. Execute actions in multiple Zapier apps

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/jobsprint/n8n-nodes-jobsprint.git
cd n8n-nodes-jobsprint

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Project Structure

```
n8n-nodes-jobsprint/
├── credentials/              # Credential types
│   └── JobsprintApi.credentials.ts
├── nodes/                    # Node implementations
│   ├── JobsprintAI.node.ts
│   ├── JobsprintPuterStorage.node.ts
│   ├── JobsprintZapier.node.ts
│   ├── JobsprintWorkflowTrigger.node.ts
│   └── JobsprintWebhookHandler.node.ts
├── tests/                    # Unit tests
│   ├── JobsprintAI.test.ts
│   ├── JobsprintPuterStorage.test.ts
│   ├── JobsprintZapier.test.ts
│   ├── JobsprintWorkflowTrigger.test.ts
│   └── JobsprintWebhookHandler.test.ts
├── docs/                     # Documentation
├── examples/                 # Usage examples
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Testing

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

### Building

```bash
# Build for production
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean
```

## API Reference

### Jobsprint AI API

#### Endpoints

- `POST /ai/chat` - Generate chat completions
- `POST /ai/completion` - Generate text/code completions

#### Request/Response

```typescript
// Chat request
{
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens: number;
  temperature: number;
}

// Response
{
  choices: Array<{
    message?: { content: string };
    text?: string;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Puter Storage API

#### Endpoints

- `POST /storage/files` - Upload file
- `GET /storage/files` - Download file
- `DELETE /storage/files` - Delete file
- `GET /storage/files/metadata` - Get file metadata
- `POST /storage/folders` - Create folder
- `GET /storage/folders` - List folder
- `DELETE /storage/folders` - Delete folder

### Zapier Integration API

#### Endpoints

- `GET /zapier/apps` - List available apps
- `GET /zapier/apps/:app/actions` - List app actions
- `GET /zapier/apps/:app/triggers` - List app triggers
- `POST /zapier/actions` - Execute action
- `POST /zapier/triggers` - Subscribe to trigger
- `POST /zapier/webhooks` - Handle webhook

### Events API

#### Endpoints

- `GET /events` - List events
- `POST /events/acknowledge` - Mark events as processed

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: https://jobsprint.ai/docs
- **Issues**: https://github.com/jobsprint/n8n-nodes-jobsprint/issues
- **Discussions**: https://github.com/jobsprint/n8n-nodes-jobsprint/discussions
- **Email**: support@jobsprint.ai

## Roadmap

- [ ] Additional AI model integrations (Claude, Gemini)
- [ ] Enhanced webhook validation
- [ ] Batch operations for storage
- [ ] Streaming AI responses
- [ ] Advanced Zapier workflow templates
- [ ] Real-time event subscriptions
- [ ] Custom function node for Jobsprint

## Changelog

### 1.0.0 (2024-01-06)

- Initial release
- Jobsprint AI node with chat/code/text completions
- Jobsprint Puter Storage node with file/folder operations
- Jobsprint Zapier node with dynamic app/action loading
- Jobsprint Workflow Trigger node with multiple trigger types
- Jobsprint Webhook Handler node with authentication
- Comprehensive error handling and validation
- Full TypeScript support
- 80%+ test coverage
