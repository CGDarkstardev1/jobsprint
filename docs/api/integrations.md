# Integrations API

Manage third-party integrations including Zapier MCP connections and n8n integrations.

## Integrations Overview

Jobsprint provides seamless integration with:

- **Zapier MCP**: 30,000+ pre-authenticated app connections
- **n8n**: Self-hosted workflow automation
- **Custom Integrations**: Build your own with webhooks

## List Integrations

Get all available and configured integrations.

```http
GET /v1/integrations
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by type (`zapier`, `n8n`, `custom`, `webhook`) |
| status | string | No | Filter by status (`connected`, `disconnected`) |
| limit | integer | No | Items per page (default: 20, max: 100) |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.jobsprint.io/v1/integrations?status=connected"
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "int_abc123",
      "type": "zapier",
      "name": "Slack",
      "description": "Send messages to Slack channels",
      "status": "connected",
      "icon": "https://cdn.jobsprint.io/icons/slack.png",
      "connectedAt": "2025-01-01T00:00:00Z",
      "lastUsed": "2025-01-06T12:00:00Z",
      "capabilities": [
        "send_message",
        "create_channel",
        "add_user"
      ]
    },
    {
      "id": "int_def456",
      "type": "n8n",
      "name": "Gmail",
      "description": "Read and send emails",
      "status": "connected",
      "icon": "https://cdn.jobsprint.io/icons/gmail.png",
      "connectedAt": "2025-01-02T00:00:00Z",
      "lastUsed": "2025-01-06T11:30:00Z",
      "capabilities": [
        "read_email",
        "send_email",
        "search_emails"
      ]
    }
  ],
  "pagination": {
    "nextCursor": "cursor_xyz789",
    "hasMore": true
  }
}
```

## Get Integration

Get details of a specific integration.

```http
GET /v1/integrations/:integrationId
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| integrationId | string | Integration ID |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/integrations/int_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "int_abc123",
    "type": "zapier",
    "name": "Slack",
    "description": "Send messages to Slack channels",
    "status": "connected",
    "icon": "https://cdn.jobsprint.io/icons/slack.png",
    "connectedAt": "2025-01-01T00:00:00Z",
    "lastUsed": "2025-01-06T12:00:00Z",
    "capabilities": [
      {
        "name": "send_message",
        "description": "Send a message to a channel",
        "parameters": [
          {
            "name": "channel",
            "type": "string",
            "required": true,
            "description": "Channel ID or name"
          },
          {
            "name": "text",
            "type": "string",
            "required": true,
            "description": "Message text"
          }
        ]
      },
      {
        "name": "create_channel",
        "description": "Create a new channel",
        "parameters": [
          {
            "name": "name",
            "type": "string",
            "required": true
          },
          {
            "name": "is_private",
            "type": "boolean",
            "required": false
          }
        ]
      }
    ],
    "configuration": {
      "workspace": "Acme Corp",
      "defaultChannel": "#general"
    },
    "usageStats": {
      "totalCalls": 1523,
      "successfulCalls": 1489,
      "failedCalls": 34,
      "successRate": 0.9777
    }
  }
}
```

## Search Available Integrations

Search for integrations that can be connected.

```http
GET /v1/integrations/available
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | No | Search query |
| category | string | No | Filter by category |
| limit | integer | No | Items per page (default: 20, max: 100) |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.jobsprint.io/v1/integrations/available?query=email"
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "zapier_gmail",
      "type": "zapier",
      "name": "Gmail",
      "description": "Read and send emails via Gmail",
      "category": "Email",
      "icon": "https://cdn.jobsprint.io/icons/gmail.png",
      "popularity": 95,
      "capabilities": [
        "read_email",
        "send_email",
        "search_emails",
        "organize_emails"
      ]
    },
    {
      "id": "zapier_outlook",
      "type": "zapier",
      "name": "Outlook",
      "description": "Microsoft Outlook email integration",
      "category": "Email",
      "icon": "https://cdn.jobsprint.io/icons/outlook.png",
      "popularity": 78,
      "capabilities": [
        "read_email",
        "send_email",
        "manage_calendar"
      ]
    }
  ]
}
```

## Connect Integration

Connect a new integration.

```http
POST /v1/integrations/:integrationId/connect
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| integrationId | string | Integration ID to connect |

### Request Body

Configuration varies by integration type.

### Zapier Integration

```json
{
  "authType": "oauth",
  "redirectUrl": "https://your-app.com/callback"
}
```

### Custom Webhook Integration

```json
{
  "name": "My Custom Webhook",
  "url": "https://your-app.com/webhook",
  "headers": {
    "Authorization": "Bearer your-token"
  }
}
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "authType": "oauth",
       "redirectUrl": "https://myapp.com/callback"
     }' \
     https://api.jobsprint.io/v1/integrations/zapier_slack/connect
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "int_new123",
    "type": "zapier",
    "name": "Slack",
    "status": "pending",
    "authUrl": "https://zapier.com/auth/...",
    "message": "Complete the authorization flow"
  }
}
```

## Disconnect Integration

Disconnect an active integration.

```http
POST /v1/integrations/:integrationId/disconnect
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| integrationId | string | Integration ID to disconnect |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/integrations/int_abc123/disconnect
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "int_abc123",
    "status": "disconnected",
    "disconnectedAt": "2025-01-06T12:00:00Z"
  }
}
```

## Test Integration

Test an integration connection.

```http
POST /v1/integrations/:integrationId/test
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| integrationId | string | Integration ID to test |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/integrations/int_abc123/test
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "int_abc123",
    "status": "healthy",
    "testResult": {
      "passed": true,
      "message": "Connection successful",
      "responseTime": 234,
      "testedAt": "2025-01-06T12:00:00Z"
    }
  }
}
```

## Execute Integration Action

Execute a specific action through an integration.

```http
POST /v1/integrations/:integrationId/actions/:actionName
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| integrationId | string | Integration ID |
| actionName | string | Action name |

### Request Body

```json
{
  "parameters": {
    "channel": "#general",
    "text": "Hello from Jobsprint!"
  }
}
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "parameters": {
         "channel": "#general",
         "text": "Hello from Jobsprint!"
       }
     }' \
     https://api.jobsprint.io/v1/integrations/int_abc123/actions/send_message
```

### Response Example

```json
{
  "success": true,
  "data": {
    "action": "send_message",
    "result": {
      "success": true,
      "messageId": "msg_xyz789",
      "channel": "#general",
      "timestamp": "2025-01-06T12:00:00Z"
    },
    "executionTime": 456
  }
}
```

## Webhook Integrations

### Create Webhook Integration

```http
POST /v1/integrations/webhooks
```

### Request Body

```json
{
  "name": "My Custom Integration",
  "url": "https://myapp.com/jobsprint-webhook",
  "events": ["workflow.executed", "workflow.failed"],
  "headers": {
    "X-Custom-Header": "value"
  },
  "secret": "webhook_secret_key"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Webhook name |
| url | string | Yes | Webhook URL |
| events | array | Yes | Events to subscribe to |
| headers | object | No | Custom headers |
| secret | string | No | HMAC secret for verification |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Custom Integration",
       "url": "https://myapp.com/jobsprint-webhook",
       "events": ["workflow.executed", "workflow.failed"],
       "secret": "my_secret_key"
     }' \
     https://api.jobsprint.io/v1/integrations/webhooks
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wh_web123",
    "name": "My Custom Integration",
    "url": "https://myapp.com/jobsprint-webhook",
    "events": ["workflow.executed", "workflow.failed"],
    "secret": "my_secret_key",
    "active": true,
    "createdAt": "2025-01-06T00:00:00Z"
  }
}
```

### Webhook Payload

When an event occurs, Jobsprint sends a POST request to your webhook URL:

```json
{
  "event": "workflow.executed",
  "timestamp": "2025-01-06T12:00:00Z",
  "data": {
    "workflowId": "wf_abc123",
    "executionId": "exec_xyz789",
    "status": "success",
    "duration": 5234
  },
  "signature": "sha256=hmac_signature_here"
}
```

Verify the signature using HMAC-SHA256 with your secret:

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Integration Logs

Get logs for integration actions.

```http
GET /v1/integrations/:integrationId/logs
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| integrationId | string | Integration ID |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Items per page (default: 20) |
| action | string | No | Filter by action name |
| fromDate | string | No | Filter after date (ISO 8601) |
| toDate | string | No | Filter before date (ISO 8601) |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.jobsprint.io/v1/integrations/int_abc123/logs?limit=10"
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "logId": "log_abc123",
      "action": "send_message",
      "status": "success",
      "input": {
        "channel": "#general",
        "text": "Hello!"
      },
      "output": {
        "messageId": "msg_xyz789"
      },
      "executionTime": 456,
      "timestamp": "2025-01-06T12:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": false
  }
}
```
