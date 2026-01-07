# Workflows API

Manage workflow automation definitions.

## List Workflows

Retrieve a list of all workflows.

```http
GET /v1/workflows
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of items per page (default: 20, max: 100) |
| after | string | No | Cursor for next page |
| before | string | No | Cursor for previous page |
| status | string | No | Filter by status (`active`, `inactive`, `draft`) |
| search | string | No | Search in workflow name and description |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.jobsprint.io/v1/workflows?limit=10&status=active"
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "wf_abc123",
      "name": "Email Auto-Responder",
      "description": "Automatically respond to incoming emails",
      "status": "active",
      "version": 3,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-06T00:00:00Z",
      "lastExecutionAt": "2025-01-06T12:30:00Z",
      "executionCount": 142
    }
  ],
  "pagination": {
    "nextCursor": "cursor_xyz789",
    "hasMore": true
  }
}
```

## Get Workflow

Retrieve a single workflow by ID.

```http
GET /v1/workflows/:workflowId
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| workflowId | string | Workflow ID |

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/workflows/wf_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "name": "Email Auto-Responder",
    "description": "Automatically respond to incoming emails",
    "status": "active",
    "version": 3,
    "definition": {
      "nodes": [
        {
          "id": "node_1",
          "type": "trigger",
          "name": "Email Received",
          "parameters": {
            "eventType": "email.received"
          }
        },
        {
          "id": "node_2",
          "type": "ai",
          "name": "Generate Response",
          "parameters": {
            "model": "gpt-3.5-turbo-free",
            "prompt": "Generate a helpful response to: {{email.body}}"
          }
        }
      ],
      "connections": [
        {
          "from": "node_1",
          "to": "node_2"
        }
      ]
    },
    "settings": {
      "timeout": 300,
      "retryOnFailure": true,
      "maxRetries": 3
    },
    "triggers": [
      {
        "type": "webhook",
        "url": "https://api.jobsprint.io/v1/webhooks/wf_abc123"
      },
      {
        "type": "schedule",
        "cron": "0 * * * *"
      }
    ],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-06T00:00:00Z",
    "lastExecutionAt": "2025-01-06T12:30:00Z",
    "executionCount": 142
  }
}
```

## Create Workflow

Create a new workflow.

```http
POST /v1/workflows
```

### Request Body

```json
{
  "name": "Email Auto-Responder",
  "description": "Automatically respond to incoming emails",
  "definition": {
    "nodes": [
      {
        "id": "node_1",
        "type": "trigger",
        "name": "Email Received",
        "parameters": {
          "eventType": "email.received"
        }
      }
    ],
    "connections": []
  },
  "settings": {
    "timeout": 300,
    "retryOnFailure": true,
    "maxRetries": 3
  }
}
```

### Required Fields

- `name` (string) - Workflow name
- `definition` (object) - Workflow definition with nodes and connections

### Optional Fields

- `description` (string) - Workflow description
- `settings` (object) - Workflow settings

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d @workflow.json \
     https://api.jobsprint.io/v1/workflows
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wf_xyz789",
    "name": "Email Auto-Responder",
    "description": "Automatically respond to incoming emails",
    "status": "draft",
    "version": 1,
    "definition": {
      // Workflow definition
    },
    "settings": {
      "timeout": 300,
      "retryOnFailure": true,
      "maxRetries": 3
    },
    "createdAt": "2025-01-06T00:00:00Z",
    "updatedAt": "2025-01-06T00:00:00Z"
  }
}
```

## Update Workflow

Update an existing workflow.

```http
PUT /v1/workflows/:workflowId
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| workflowId | string | Workflow ID |

### Request Body

Same as Create Workflow.

### Request Example

```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d @workflow-updated.json \
     https://api.jobsprint.io/v1/workflows/wf_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "name": "Email Auto-Responder (Updated)",
    "version": 2,
    "updatedAt": "2025-01-06T12:00:00Z"
    // ... other fields
  }
}
```

## Delete Workflow

Delete a workflow.

```http
DELETE /v1/workflows/:workflowId
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| workflowId | string | Workflow ID |

### Request Example

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/workflows/wf_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "deleted": true
  }
}
```

## Activate Workflow

Activate a workflow (change status from draft/inactive to active).

```http
POST /v1/workflows/:workflowId/activate
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| workflowId | string | Workflow ID |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/workflows/wf_abc123/activate
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "status": "active",
    "activatedAt": "2025-01-06T12:00:00Z"
  }
}
```

## Deactivate Workflow

Deactivate a workflow (change status from active to inactive).

```http
POST /v1/workflows/:workflowId/deactivate
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| workflowId | string | Workflow ID |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/workflows/wf_abc123/deactivate
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "status": "inactive",
    "deactivatedAt": "2025-01-06T12:00:00Z"
  }
}
```

## Validate Workflow

Validate a workflow definition without saving it.

```http
POST /v1/workflows/validate
```

### Request Body

```json
{
  "definition": {
    "nodes": [],
    "connections": []
  }
}
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d @workflow-definition.json \
     https://api.jobsprint.io/v1/workflows/validate
```

### Response Example

```json
{
  "success": true,
  "data": {
    "valid": true,
    "warnings": [
      {
        "type": "performance",
        "message": "Large timeout value may impact performance"
      }
    ]
  }
}
```

## Duplicate Workflow

Create a copy of an existing workflow.

```http
POST /v1/workflows/:workflowId/duplicate
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| workflowId | string | Workflow ID to duplicate |

### Request Body

```json
{
  "name": "Copy of Email Auto-Responder"
}
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Copy of Email Auto-Responder"}' \
     https://api.jobsprint.io/v1/workflows/wf_abc123/duplicate
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "wf_dup123",
    "name": "Copy of Email Auto-Responder",
    "originalWorkflowId": "wf_abc123",
    "createdAt": "2025-01-06T12:00:00Z"
  }
}
```
