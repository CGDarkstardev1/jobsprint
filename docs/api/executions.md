# Workflow Executions API

Manage workflow execution instances and results.

## List Executions

Retrieve execution history for workflows.

```http
GET /v1/executions
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of items per page (default: 20, max: 100) |
| after | string | No | Cursor for next page |
| before | string | No | Cursor for previous page |
| workflowId | string | No | Filter by workflow ID |
| status | string | No | Filter by status (`success`, `error`, `running`, `pending`) |
| fromDate | string | No | Filter executions after this date (ISO 8601) |
| toDate | string | No | Filter executions before this date (ISO 8601) |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.jobsprint.io/v1/executions?status=success&limit=10"
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "exec_abc123",
      "workflowId": "wf_abc123",
      "workflowName": "Email Auto-Responder",
      "status": "success",
      "startedAt": "2025-01-06T12:30:00Z",
      "finishedAt": "2025-01-06T12:30:05Z",
      "duration": 5234,
      "triggeredBy": "webhook",
      "inputData": {
        "email": {
          "from": "user@example.com",
          "subject": "Support Request"
        }
      }
    }
  ],
  "pagination": {
    "nextCursor": "cursor_xyz789",
    "hasMore": true
  }
}
```

## Get Execution

Retrieve details of a specific execution.

```http
GET /v1/executions/:executionId
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| executionId | string | Execution ID |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/executions/exec_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "exec_abc123",
    "workflowId": "wf_abc123",
    "workflowName": "Email Auto-Responder",
    "status": "success",
    "startedAt": "2025-01-06T12:30:00Z",
    "finishedAt": "2025-01-06T12:30:05Z",
    "duration": 5234,
    "triggeredBy": "webhook",
    "inputData": {
      "email": {
        "from": "user@example.com",
        "subject": "Support Request",
        "body": "I need help with..."
      }
    },
    "outputData": {
      "response": "Thank you for your request...",
      "sent": true
    },
    "executionSteps": [
      {
        "stepId": "node_1",
        "stepName": "Email Received",
        "status": "success",
        "startedAt": "2025-01-06T12:30:00Z",
        "finishedAt": "2025-01-06T12:30:01Z",
        "output": {
          "email": {
            "from": "user@example.com",
            "subject": "Support Request"
          }
        }
      },
      {
        "stepId": "node_2",
        "stepName": "Generate Response",
        "status": "success",
        "startedAt": "2025-01-06T12:30:01Z",
        "finishedAt": "2025-01-06T12:30:05Z",
        "output": {
          "response": "Thank you for your request..."
        }
      }
    ],
    "logs": [
      {
        "level": "info",
        "message": "Starting workflow execution",
        "timestamp": "2025-01-06T12:30:00Z"
      },
      {
        "level": "info",
        "message": "Email received trigger activated",
        "timestamp": "2025-01-06T12:30:00Z"
      },
      {
        "level": "info",
        "message": "AI response generated successfully",
        "timestamp": "2025-01-06T12:30:05Z"
      }
    ]
  }
}
```

## Execute Workflow

Manually trigger a workflow execution.

```http
POST /v1/workflows/:workflowId/execute
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| workflowId | string | Workflow ID to execute |

### Request Body

```json
{
  "inputData": {
    "key": "value"
  },
  "options": {
    "waitForCompletion": false,
    "timeout": 300
  }
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| inputData | object | No | Input data for the workflow |
| options.waitForCompletion | boolean | No | Wait for execution to complete (default: false) |
| options.timeout | integer | No | Execution timeout in seconds (default: 300) |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "inputData": {
         "email": {
           "from": "user@example.com",
           "subject": "Test"
         }
       },
       "options": {
         "waitForCompletion": true
       }
     }' \
     https://api.jobsprint.io/v1/workflows/wf_abc123/execute
```

### Response Example (Async)

```json
{
  "success": true,
  "data": {
    "executionId": "exec_new123",
    "status": "running",
    "startedAt": "2025-01-06T12:30:00Z",
    "url": "https://api.jobsprint.io/v1/executions/exec_new123"
  }
}
```

### Response Example (Sync, with waitForCompletion: true)

```json
{
  "success": true,
  "data": {
    "executionId": "exec_new123",
    "status": "success",
    "startedAt": "2025-01-06T12:30:00Z",
    "finishedAt": "2025-01-06T12:30:05Z",
    "duration": 5234,
    "outputData": {
      "response": "Thank you for your request..."
    }
  }
}
```

## Cancel Execution

Cancel a running workflow execution.

```http
POST /v1/executions/:executionId/cancel
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| executionId | string | Execution ID to cancel |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/executions/exec_abc123/cancel
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "exec_abc123",
    "status": "cancelled",
    "cancelledAt": "2025-01-06T12:30:00Z"
  }
}
```

## Retry Execution

Retry a failed execution.

```http
POST /v1/executions/:executionId/retry
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| executionId | string | Execution ID to retry |

### Request Body

```json
{
  "fromStep": "node_2"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fromStep | string | No | Retry from specific step ID (default: failed step) |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{}' \
     https://api.jobsprint.io/v1/executions/exec_abc123/retry
```

### Response Example

```json
{
  "success": true,
  "data": {
    "executionId": "exec_retry123",
    "originalExecutionId": "exec_abc123",
    "status": "running",
    "startedAt": "2025-01-06T12:30:00Z"
  }
}
```

## Get Execution Logs

Retrieve detailed logs for an execution.

```http
GET /v1/executions/:executionId/logs
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| executionId | string | Execution ID |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/executions/exec_abc123/logs
```

### Response Example

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "level": "info",
        "message": "Starting workflow execution",
        "timestamp": "2025-01-06T12:30:00.123Z",
        "stepId": null
      },
      {
        "level": "debug",
        "message": "Processing input data",
        "timestamp": "2025-01-06T12:30:00.234Z",
        "stepId": "node_1",
        "data": {
          "input": {
            "email": "user@example.com"
          }
        }
      },
      {
        "level": "info",
        "message": "AI model response received",
        "timestamp": "2025-01-06T12:30:04.567Z",
        "stepId": "node_2"
      },
      {
        "level": "info",
        "message": "Workflow execution completed successfully",
        "timestamp": "2025-01-06T12:30:05.123Z",
        "stepId": null
      }
    ]
  }
}
```

## Get Execution Metrics

Get metrics and statistics for executions.

```http
GET /v1/executions/metrics
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workflowId | string | No | Filter by workflow ID |
| fromDate | string | No | Start date for metrics (ISO 8601) |
| toDate | string | No | End date for metrics (ISO 8601) |
| granularity | string | No | Time granularity (`hour`, `day`, `week`) |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.jobsprint.io/v1/executions/metrics?workflowId=wf_abc123&granularity=day"
```

### Response Example

```json
{
  "success": true,
  "data": {
    "totalExecutions": 1250,
    "successfulExecutions": 1187,
    "failedExecutions": 63,
    "successRate": 0.9496,
    "averageDuration": 4234,
    "p50Duration": 3456,
    "p95Duration": 6789,
    "p99Duration": 8912,
    "timeSeries": [
      {
        "timestamp": "2025-01-01T00:00:00Z",
        "count": 150,
        "successRate": 0.9533,
        "averageDuration": 4123
      },
      {
        "timestamp": "2025-01-02T00:00:00Z",
        "count": 162,
        "successRate": 0.9506,
        "averageDuration": 4345
      }
    ]
  }
}
```

## Delete Execution

Delete an execution record.

```http
DELETE /v1/executions/:executionId
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| executionId | string | Execution ID |

### Request Example

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/executions/exec_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "exec_abc123",
    "deleted": true
  }
}
```
