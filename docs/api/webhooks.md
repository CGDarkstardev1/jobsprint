# Webhooks API

Manage webhook endpoints and subscriptions for real-time event notifications.

## Webhooks Overview

Webhooks allow Jobsprint to send real-time notifications to your application when events occur. Webhooks are ideal for:

- Processing workflow execution results
- Responding to workflow failures
- Syncing data with external systems
- Building custom integrations

## Webhook Events

### Available Events

| Event | Description | Payload |
|-------|-------------|---------|
| `workflow.created` | Workflow created | Workflow object |
| `workflow.updated` | Workflow updated | Workflow object |
| `workflow.deleted` | Workflow deleted | Workflow ID |
| `workflow.activated` | Workflow activated | Workflow object |
| `workflow.deactivated` | Workflow deactivated | Workflow object |
| `workflow.executed` | Workflow execution completed | Execution object |
| `workflow.failed` | Workflow execution failed | Execution object with error |
| `execution.started` | Execution started | Execution object |
| `execution.completed` | Execution completed | Execution object |
| `integration.connected` | Integration connected | Integration object |
| `integration.disconnected` | Integration disconnected | Integration object |

## List Webhooks

Get all configured webhooks.

```http
GET /v1/webhooks
```

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/webhooks
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "wh_abc123",
      "name": "Production Webhook",
      "url": "https://myapp.com/jobsprint-webhook",
      "events": ["workflow.executed", "workflow.failed"],
      "active": true,
      "secret": "********",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastTriggered": "2025-01-06T12:00:00Z",
      "stats": {
        "totalSent": 1523,
        "successful": 1489,
        "failed": 34,
        "lastStatusCode": 200
      }
    }
  ]
}
```

## Get Webhook

Get details of a specific webhook.

```http
GET /v1/webhooks/:webhookId
```

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/webhooks/wh_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wh_abc123",
    "name": "Production Webhook",
    "url": "https://myapp.com/jobsprint-webhook",
    "events": ["workflow.executed", "workflow.failed"],
    "active": true,
    "secret": "webhook_secret_key",
    "headers": {
      "X-Custom-Header": "custom-value"
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "lastTriggered": "2025-01-06T12:00:00Z",
    "stats": {
      "totalSent": 1523,
      "successful": 1489,
      "failed": 34,
      "successRate": 0.9777,
      "lastStatusCode": 200,
      "avgResponseTime": 234
    }
  }
}
```

## Create Webhook

Create a new webhook.

```http
POST /v1/webhooks
```

### Request Body

```json
{
  "name": "Production Webhook",
  "url": "https://myapp.com/jobsprint-webhook",
  "events": ["workflow.executed", "workflow.failed"],
  "secret": "my_secret_key",
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Webhook name |
| url | string | Yes | Webhook URL (must be HTTPS) |
| events | array | Yes | Events to subscribe to |
| secret | string | Yes | HMAC secret for signature verification |
| headers | object | No | Custom headers to include |
| active | boolean | No | Enable webhook immediately (default: true) |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Production Webhook",
       "url": "https://myapp.com/jobsprint-webhook",
       "events": ["workflow.executed", "workflow.failed"],
       "secret": "my_secret_key",
       "headers": {
         "X-Custom-Header": "value"
       }
     }' \
     https://api.jobsprint.io/v1/webhooks
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wh_new123",
    "name": "Production Webhook",
    "url": "https://myapp.com/jobsprint-webhook",
    "events": ["workflow.executed", "workflow.failed"],
    "active": true,
    "secret": "my_secret_key",
    "createdAt": "2025-01-06T00:00:00Z"
  }
}
```

## Update Webhook

Update an existing webhook.

```http
PUT /v1/webhooks/:webhookId
```

### Request Body

Same as Create Webhook (all fields optional except URL).

### Request Example

```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "events": ["workflow.executed", "workflow.failed", "workflow.created"],
       "active": true
     }' \
     https://api.jobsprint.io/v1/webhooks/wh_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wh_abc123",
    "name": "Production Webhook",
    "events": ["workflow.executed", "workflow.failed", "workflow.created"],
    "active": true,
    "updatedAt": "2025-01-06T12:00:00Z"
  }
}
```

## Delete Webhook

Delete a webhook.

```http
DELETE /v1/webhooks/:webhookId
```

### Request Example

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/webhooks/wh_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wh_abc123",
    "deleted": true
  }
}
```

## Test Webhook

Send a test event to a webhook.

```http
POST /v1/webhooks/:webhookId/test
```

### Request Body

```json
{
  "event": "workflow.executed",
  "data": {
    "test": true
  }
}
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "event": "workflow.executed"
     }' \
     https://api.jobsprint.io/v1/webhooks/wh_abc123/test
```

### Response Example

```json
{
  "success": true,
  "data": {
    "testEvent": {
      "event": "workflow.executed",
      "timestamp": "2025-01-06T12:00:00Z",
      "data": {
        "test": true
      }
    },
    "result": {
      "sent": true,
      "statusCode": 200,
      "responseTime": 234
    }
  }
}
```

## Webhook Signature Verification

Each webhook payload includes a signature header for verification:

### Signature Header

```
X-Jobsprint-Signature: sha256=signature_here
```

### Verification Process

#### JavaScript/Node.js

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  const expectedSignature = `sha256=${digest}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage
const express = require('express');
const app = express();

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-jobsprint-signature'];
  const payload = req.body.toString();

  if (verifySignature(payload, signature, 'your_webhook_secret')) {
    // Process webhook
    const data = JSON.parse(payload);
    console.log('Webhook verified:', data);
    res.sendStatus(200);
  } else {
    console.log('Invalid signature');
    res.sendStatus(403);
  }
});
```

#### Python

```python
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

def verify_signature(payload, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Jobsprint-Signature')
    payload = request.get_data(as_text=True)

    if verify_signature(payload, signature, 'your_webhook_secret'):
        data = request.get_json()
        print('Webhook verified:', data)
        return '', 200
    else:
        print('Invalid signature')
        return '', 403
```

#### Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "io"
    "log"
    "net/http"
)

func verifySignature(payload []byte, signature string, secret string) bool {
    h := hmac.New(sha256.New, []byte(secret))
    h.Write(payload)
    expectedSignature := "sha256=" + hex.EncodeToString(h.Sum(nil))

    return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    signature := r.Header.Get("X-Jobsprint-Signature")

    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Error reading request", http.StatusBadRequest)
        return
    }

    if verifySignature(body, signature, "your_webhook_secret") {
        var data map[string]interface{}
        json.Unmarshal(body, &data)
        log.Println("Webhook verified:", data)
        w.WriteHeader(http.StatusOK)
    } else {
        log.Println("Invalid signature")
        w.WriteHeader(http.StatusForbidden)
    }
}

func main() {
    http.HandleFunc("/webhook", webhookHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Webhook Payloads

### Workflow Executed

```json
{
  "event": "workflow.executed",
  "timestamp": "2025-01-06T12:00:00Z",
  "data": {
    "workflowId": "wf_abc123",
    "executionId": "exec_xyz789",
    "workflowName": "Email Auto-Responder",
    "status": "success",
    "duration": 5234,
    "triggeredBy": "webhook",
    "inputData": {
      "email": {
        "from": "user@example.com",
        "subject": "Support Request"
      }
    },
    "outputData": {
      "response": "Thank you for your request..."
    }
  }
}
```

### Workflow Failed

```json
{
  "event": "workflow.failed",
  "timestamp": "2025-01-06T12:00:00Z",
  "data": {
    "workflowId": "wf_abc123",
    "executionId": "exec_xyz789",
    "workflowName": "Email Auto-Responder",
    "status": "error",
    "error": {
      "code": "AI_MODEL_ERROR",
      "message": "Failed to generate AI response",
      "stepId": "node_2",
      "stepName": "Generate Response"
    },
    "triggeredBy": "webhook"
  }
}
```

### Workflow Created

```json
{
  "event": "workflow.created",
  "timestamp": "2025-01-06T12:00:00Z",
  "data": {
    "id": "wf_abc123",
    "name": "Email Auto-Responder",
    "description": "Automatically respond to incoming emails",
    "status": "draft",
    "version": 1
  }
}
```

## Best Practices

### 1. Quick Response

Always respond quickly (within 5 seconds):

```javascript
app.post('/webhook', (req, res) => {
  // Verify signature first
  if (!verifySignature(req.body, req.headers['x-jobsprint-signature'])) {
    return res.sendStatus(403);
  }

  // Send 200 OK immediately
  res.sendStatus(200);

  // Process asynchronously
  processWebhookAsync(req.body);
});
```

### 2. Idempotency

Handle duplicate webhook deliveries:

```javascript
const processedEvents = new Set();

function processWebhook(event) {
  const eventId = event.timestamp + event.executionId;

  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping');
    return;
  }

  processedEvents.add(eventId);

  // Process event
  // ...
}
```

### 3. Retry Logic

Implement exponential backoff for retries:

```javascript
async function processWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await processEvent(data);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
}
```

### 4. Security

- Always verify signatures
- Use HTTPS endpoints only
- Rotate secrets periodically
- Never expose secrets in logs

### 5. Monitoring

Monitor webhook delivery:

```javascript
function trackWebhook(event, status, responseTime) {
  metrics.increment('webhooks.received');
  metrics.timing('webhooks.response_time', responseTime);

  if (status !== 200) {
    metrics.increment('webhooks.errors');
  }
}
```

## Webhook Delivery

Jobsprint automatically retries failed webhook deliveries:

| Retry | Delay |
|-------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |

If all retries fail, the webhook is disabled and a notification is sent.
