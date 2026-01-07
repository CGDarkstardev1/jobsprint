# Zapier MCP Integration for Jobsprint

Complete integration guide for using Zapier's Model Context Protocol (MCP) with the Jobsprint AI Automation Platform.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Components](#core-components)
5. [API Reference](#api-reference)
6. [Workflow Templates](#workflow-templates)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

## Overview

The Zapier MCP integration provides access to 8,000+ app integrations and 30,000+ pre-authenticated actions directly from your Jobsprint application. This eliminates the need for complex API integrations and authentication management.

### Key Features

- **Pre-authenticated Connections**: No need to manage OAuth flows or API keys
- **Rate Limiting**: Built-in request throttling and quota management
- **Automatic Retries**: Exponential backoff for failed requests
- **Webhook Support**: Real-time trigger handling
- **Error Handling**: Comprehensive error classification and recovery
- **Connection Pooling**: Efficient connection management
- **Workflow Templates**: Pre-built automation patterns

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Jobsprint App  │────▶│  Zapier MCP      │────▶│  External Apps  │
│                 │     │  Client          │     │  (Slack, Gmail) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ├─ Connection Manager
                              ├─ Trigger Registry
                              ├─ Action Dispatcher
                              ├─ Webhook Handler
                              └─ Error Handler
```

## Installation

The integration is included in the Jobsprint platform. No additional installation required.

### Environment Variables

Set the following environment variables:

```bash
ZAPIER_MCP_ENDPOINT=https://mcp.zapier.app/your-endpoint-id
ZAPIER_MCP_API_KEY=your-api-key
ZAPIER_WEBHOOK_SECRET=your-webhook-secret
```

### Client Configuration

```javascript
const { createZapierMCPClient } = require('./integrations/zapier');

const client = createZapierMCPClient({
  endpointUrl: process.env.ZAPIER_MCP_ENDPOINT,
  apiKey: process.env.ZAPIER_MCP_API_KEY,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  rateLimits: {
    maxRequests: 80,
    windowMs: 3600000,
  },
});
```

## Quick Start

### 1. Initialize the Client

```javascript
const client = createZapierMCPClient({
  endpointUrl: 'https://mcp.zapier.app/your-id',
  apiKey: 'your-api-key',
});

// Initialize and discover available actions
const init = await client.initialize();
console.log(`Discovered ${init.actionsCount} actions`);
```

### 2. Connect to an App

```javascript
const connection = await client.connectApp('slack', {
  // Pre-authenticated, no credentials needed
});

console.log(`Connected: ${connection.connectionId}`);
```

### 3. Execute an Action

```javascript
const result = await client.executeAction('slack.postMessage', {
  channel: '#general',
  text: 'Hello from Jobsprint!',
});

console.log(result);
```

### 4. Handle Webhooks

```javascript
client.registerTrigger('new-message', (payload) => {
  console.log('New message received:', payload);
  return { success: true };
});
```

## Core Components

### ZapierMCPClient

Main client for Zapier MCP interactions.

#### Initialization

```javascript
const client = new ZapierMCPClient({
  endpointUrl: 'https://mcp.zapier.app/your-id',
  apiKey: 'your-api-key',
  maxRetries: 3,           // Maximum retry attempts
  retryDelay: 1000,        // Initial retry delay (ms)
  timeout: 30000,          // Request timeout (ms)
  rateLimits: {
    maxRequests: 80,       // Max requests per window
    windowMs: 3600000,     // Time window (1 hour)
  },
});
```

#### Methods

##### `initialize()`

Initialize client and discover available actions.

```javascript
const result = await client.initialize();
// Returns: { success, endpointUrl, actionsCount, actions, timestamp }
```

##### `connectApp(appId, credentials)`

Connect to a Zapier app.

```javascript
const connection = await client.connectApp('slack', {});
// Returns: { success, appId, connectionId, status }
```

##### `disconnectApp(appId)`

Disconnect from an app.

```javascript
await client.disconnectApp('slack');
```

##### `executeAction(actionId, params, options)`

Execute an action.

```javascript
const result = await client.executeAction(
  'slack.postMessage',
  { channel: '#general', text: 'Hello' },
  { timeout: 10000, async: false }
);
```

##### `registerTrigger(triggerId, handler)`

Register a webhook trigger handler.

```javascript
client.registerTrigger('new-message', (payload) => {
  console.log('Triggered:', payload);
  return { processed: true };
});
```

##### `getStatus()`

Get client status and statistics.

```javascript
const status = client.getStatus();
// Returns: { endpointUrl, connectedApps, availableActions, registeredTriggers, rateLimit }
```

### ZapierConnectionManager

Manages app connections with pooling and health checks.

```javascript
const { ZapierConnectionManager } = require('./integrations/zapier-connection-manager');

const manager = new ZapierConnectionManager(client, {
  maxConnections: 10,
  connectionTimeout: 30000,
  autoReconnect: true,
  reconnectInterval: 5000,
  healthCheckInterval: 60000,
});

// Connect to app
await manager.connect('slack', {});

// Test connection health
const isHealthy = await manager.testConnection('slack');

// Get all connections
const connections = manager.getAllConnections();
```

### ZapierTriggerRegistry

Manages trigger registration and execution.

```javascript
const { ZapierTriggerRegistry } = require('./integrations/zapier-trigger-registry');

const registry = new ZapierTriggerRegistry(client);

// Register trigger
registry.registerTrigger('email-received', {
  appId: 'gmail',
  eventType: 'new_email',
  inputSchema: {
    required: ['from', 'subject'],
    properties: {
      from: { type: 'string' },
      subject: { type: 'string' },
    },
  },
}, async (payload) => {
  console.log('New email:', payload);
  return { success: true };
});

// Execute trigger manually
await registry.executeTrigger('email-received', {
  from: 'user@example.com',
  subject: 'Test',
});

// Get trigger stats
const stats = registry.getTriggerStats('email-received');
console.log(stats);
```

### ZapierActionDispatcher

Manages action execution with rate limiting and batching.

```javascript
const { ZapierActionDispatcher } = require('./integrations/zapier-action-dispatcher');

const dispatcher = new ZapierActionDispatcher(client, {
  maxConcurrent: 5,
  maxQueueSize: 100,
  enableBatching: true,
  maxBatchSize: 10,
});

// Dispatch single action
const result = await dispatcher.dispatch('slack.postMessage', {
  channel: '#general',
  text: 'Hello',
});

// Dispatch batch
const batchResult = await dispatcher.dispatchBatch([
  { actionId: 'slack.postMessage', params: { channel: '#general', text: 'Message 1' } },
  { actionId: 'slack.postMessage', params: { channel: '#general', text: 'Message 2' } },
]);

// Dispatch with parallelism
const results = await dispatcher.dispatchParallel(
  actions,
  3, // Max 3 concurrent
  { timeout: 10000 }
);
```

### ZapierWebhookHandler

Handles incoming webhook requests.

```javascript
const { ZapierWebhookHandler } = require('./integrations/zapier-webhook-handler');

const webhookHandler = new ZapierWebhookHandler(client, {
  secret: 'webhook-secret',
  verifySignature: true,
  maxPayloadSize: 1024 * 1024, // 1MB
});

// Register webhook
webhookHandler.registerWebhook('slack-events', {
  path: '/webhooks/slack',
  method: 'POST',
  appId: 'slack',
  eventType: 'message',
  requireAuth: true,
}, async (payload) => {
  console.log('Webhook received:', payload);
  return { success: true };
});

// Handle incoming webhook
const result = await webhookHandler.handleWebhook('slack-events', {
  method: 'POST',
  payload: { text: 'Hello' },
  signature: 'generated-signature',
});
```

### ZapierErrorHandler

Comprehensive error handling with retries and circuit breakers.

```javascript
const { ZapierErrorHandler } = require('./integrations/zapier-error-handler');

const errorHandler = new ZapierErrorHandler({
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 30000,
  retryMultiplier: 2,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
  enableDeadLetterQueue: true,
});

// Handle error with retry
try {
  const result = await errorHandler.handleError(
    error,
    async () => await riskyOperation(),
    { operationId: 'my-operation' }
  );
} catch (error) {
  console.error('All retries failed:', error);
}

// Get error stats
const stats = errorHandler.getErrorStats('my-operation');
console.log('Circuit breaker open:', stats.circuitBreakerOpen);
```

## Workflow Templates

Pre-built workflow templates for common automation scenarios.

### Available Templates

1. **Slack Notification** - Send notifications to Slack
2. **Email Automation** - Auto-respond and organize emails
3. **CRM Sync** - Synchronize customer data
4. **Social Media** - Schedule and post content
5. **Data Backup** - Automated backup workflows
6. **Task Management** - Create and update tasks
7. **Customer Support** - Support ticket automation
8. **Document Generation** - Generate documents from templates

### Using Templates

```javascript
const { ZapierWorkflowTemplates } = require('./integrations/zapier-workflow-templates');

// Get all templates
const templates = ZapierWorkflowTemplates.getAllTemplates();

// Get specific template
const slackTemplate = ZapierWorkflowTemplates.getTemplate('slack-notification');

// Use template to create workflow
for (const trigger of slackTemplate.triggers) {
  client.registerTrigger(trigger.id, trigger.config, async (payload) => {
    // Execute actions
    for (const action of slackTemplate.actions) {
      await client.executeAction(action.actionId, action.params);
    }
    return { success: true };
  });
}
```

## Error Handling

### Error Classification

The error handler classifies errors into:

- **timeout**: Request timeout
- **rate_limit**: Rate limit exceeded
- **server_error**: 5xx errors
- **client_error**: 4xx errors (non-retryable)
- **network_error**: Network connectivity issues
- **unknown**: Unclassified errors

### Retry Strategy

Only retryable errors are retried with exponential backoff:

```javascript
Attempt 1: Immediate
Attempt 2: 1000ms delay
Attempt 3: 2000ms delay
Attempt 4: 4000ms delay
...up to maxDelay (30000ms)
```

### Circuit Breaker

After 5 consecutive failures, the circuit breaker opens:

- Subsequent requests fail immediately
- Circuit resets after 60 seconds
- Error count resets on successful request

### Dead Letter Queue

Failed operations after max retries are added to dead letter queue:

```javascript
// Get failed items
const failedItems = errorHandler.getDeadLetterQueue(100);

// Retry failed item
await errorHandler.retryDeadLetterItem(itemId, async () => {
  return await operation();
});
```

## Testing

### Unit Tests

Run unit tests:

```bash
npm test -- tests/integrations/zapier.test.js
npm test -- tests/integrations/zapier-utils.test.js
```

### Test Coverage

```bash
npm test -- --coverage
```

### Mocking External APIs

Tests use mocks for external API calls:

```javascript
// Mock fetch
global.fetch = jest.fn();
fetch.mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, actions: [] }),
});
```

## Best Practices

### 1. Rate Limiting

Always respect rate limits:

```javascript
const client = createZapierMCPClient({
  rateLimits: {
    maxRequests: 80,  // Free tier limit
    windowMs: 3600000, // 1 hour
  },
});

// Monitor rate limit usage
const status = client.getStatus();
console.log(`Rate limit: ${status.rateLimit.used}/${status.rateLimit.max}`);
```

### 2. Error Handling

Always handle errors properly:

```javascript
try {
  const result = await client.executeAction(actionId, params);
  return result;
} catch (error) {
  // Log error
  console.error('Action failed:', error.message);

  // Check if retryable
  if (isRetryableStatus(error.statusCode)) {
    // Retry logic
  }

  // Handle gracefully
  return { success: false, error: error.message };
}
```

### 3. Connection Management

Use connection manager for efficient pooling:

```javascript
const manager = new ZapierConnectionManager(client);

// Reuse connections
await manager.connect('slack', {});
await manager.connect('gmail', {});

// Periodic health checks
setInterval(async () => {
  await manager.testConnection('slack');
}, 60000);
```

### 4. Webhook Security

Always verify webhook signatures:

```javascript
const webhookHandler = new ZapierWebhookHandler(client, {
  secret: process.env.ZAPIER_WEBHOOK_SECRET,
  verifySignature: true,
});
```

### 5. Batch Operations

Use batching for better performance:

```javascript
const dispatcher = new ZapierActionDispatcher(client);

// Instead of individual calls
for (const item of items) {
  await client.executeAction(actionId, item);
}

// Use batch
await dispatcher.dispatchBatch(
  items.map(item => ({ actionId, params: item }))
);
```

## Examples

### Example 1: Slack Notifications

```javascript
const { createZapierMCPClient } = require('./integrations/zapier');

// Initialize client
const client = createZapierMCPClient({
  endpointUrl: process.env.ZAPIER_MCP_ENDPOINT,
  apiKey: process.env.ZAPIER_MCP_API_KEY,
});

await client.initialize();

// Connect to Slack
await client.connectApp('slack', {});

// Send message
await client.executeAction('slack.postMessage', {
  channel: '#general',
  text: 'Hello from Jobsprint!',
  username: 'Jobsprint Bot',
});
```

### Example 2: Email Automation

```javascript
// Register email trigger
client.registerTrigger('new-email', async (email) => {
  // Extract data
  const { from, subject, body } = email;

  // Add to CRM
  await client.executeAction('salesforce.createLead', {
    email: from,
    source: 'Email Inquiry',
  });

  // Send auto-reply
  await client.executeAction('gmail.send', {
    to: from,
    subject: `Re: ${subject}`,
    body: 'Thank you for your email. We will respond shortly.',
  });

  return { success: true };
});
```

### Example 3: Social Media Automation

```javascript
// Post to multiple platforms
async function postToSocialMedia(content) {
  const platforms = ['twitter', 'linkedin', 'facebook'];

  const dispatcher = new ZapierActionDispatcher(client);

  // Post to all platforms in parallel
  await dispatcher.dispatchParallel(
    platforms.map(platform => ({
      actionId: `${platform}.post`,
      params: { content },
    })),
    3 // Max 3 concurrent
  );
}
```

### Example 4: Customer Support Workflow

```javascript
// Register support ticket trigger
client.registerTrigger('new-ticket', async (ticket) => {
  const { priority, subject, description, customerEmail } = ticket;

  // Route based on priority
  if (priority === 'urgent') {
    // Notify Slack
    await client.executeAction('slack.postMessage', {
      channel: '#support-urgent',
      text: `🚨 Urgent ticket: ${subject}`,
    });

    // Assign to senior agent
    await client.executeAction('zendesk.updateTicket', {
      ticketId: ticket.id,
      assigneeId: 'senior-agent-id',
      priority: 'high',
    });
  } else {
    // Standard routing
    await client.executeAction('zendesk.updateTicket', {
      ticketId: ticket.id,
      assigneeId: 'agent-id',
    });
  }

  // Log in CRM
  await client.executeAction('salesforce.createCase', {
    subject,
    description,
    customerEmail,
    priority,
  });

  // Send confirmation
  await client.executeAction('gmail.send', {
    to: customerEmail,
    subject: 'Ticket Received',
    body: `We received your ticket: ${subject}. Reference #${ticket.id}`,
  });

  return { success: true };
});
```

## Support

For issues, questions, or contributions:

- **Documentation**: `/docs/integrations/`
- **Tests**: `/tests/integrations/`
- **Source Code**: `/src/frontend/js/integrations/`

## References

- [Zapier MCP Official Guide](https://zapier.com/blog/zapier-mcp-guide/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Jobsprint Platform Docs](/README.md)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-06
