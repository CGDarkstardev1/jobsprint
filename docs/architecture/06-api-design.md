# API Design

## Overview

Jobsprint exposes a RESTful API with JSON payload format, following OpenAPI 3.0 specification standards.

## API Architecture

### Design Principles
1. **RESTful**: Resource-oriented URLs with HTTP verbs
2. **Stateless**: Each request contains all necessary context
3. **Versioned**: `/api/v1/` prefix for versioning
4. **Consistent**: Standard response format across all endpoints
5. **Secure**: Authentication required for all endpoints except auth

### Base URL
```
Production:  https://api.jobsprint.io/api/v1
Development: http://localhost:3000/api/v1
```

### Standard Response Format

#### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-01-06T00:00:00Z",
    "requestId": "uuid",
    "version": "1.0"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-06T00:00:00Z",
    "requestId": "uuid",
    "version": "1.0"
  }
}
```

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}

Response 201:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "role": "user",
      "created_at": "2024-01-06T00:00:00Z"
    },
    "token": "jwt_token",
    "expires_at": "2024-01-07T00:00:00Z"
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token",
    "expires_at": "2024-01-07T00:00:00Z"
  }
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expires_at": "2024-01-08T00:00:00Z"
  }
}
```

### User Endpoints

#### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "role": "user",
    "is_verified": true,
    "created_at": "2024-01-06T00:00:00Z",
    "settings": { /* user settings */ }
  }
}
```

#### Update User
```http
PATCH /api/v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "full_name": "John Updated",
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}

Response 200:
{
  "success": true,
  "data": { /* updated user object */ }
}
```

#### Change Password
```http
POST /api/v1/users/me/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}

Response 200:
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

### Workflow Endpoints

#### List Workflows
```http
GET /api/v1/workflows
Authorization: Bearer {token}
Query Parameters:
  - page: integer (default: 1)
  - limit: integer (default: 20, max: 100)
  - status: 'active' | 'inactive' (optional)
  - category: string (optional)
  - search: string (optional)
  - sort: 'created_at' | 'updated_at' | 'name' (default: 'updated_at')

Response 200:
{
  "success": true,
  "data": {
    "workflows": [ /* workflow objects */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### Get Workflow
```http
GET /api/v1/workflows/{workflow_id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Email Auto-Responder",
    "description": "Automatically respond to emails",
    "definition": { /* n8n workflow JSON */ },
    "version": 1,
    "is_active": true,
    "category": "automation",
    "tags": ["email", "ai"],
    "stats": {
      "total_executions": 150,
      "successful_executions": 142,
      "failed_executions": 8
    },
    "created_at": "2024-01-06T00:00:00Z",
    "updated_at": "2024-01-06T00:00:00Z"
  }
}
```

#### Create Workflow
```http
POST /api/v1/workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Email Auto-Responder",
  "description": "Automatically respond to emails",
  "definition": { /* n8n workflow JSON */ },
  "category": "automation",
  "tags": ["email", "ai"]
}

Response 201:
{
  "success": true,
  "data": { /* workflow object */ }
}
```

#### Update Workflow
```http
PUT /api/v1/workflows/{workflow_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "definition": { /* updated workflow JSON */ }
}

Response 200:
{
  "success": true,
  "data": { /* updated workflow object */ }
}
```

#### Delete Workflow
```http
DELETE /api/v1/workflows/{workflow_id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "message": "Workflow deleted successfully"
  }
}
```

#### Activate/Deactivate Workflow
```http
PATCH /api/v1/workflows/{workflow_id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_active": true
}

Response 200:
{
  "success": true,
  "data": { /* workflow object */ }
}
```

### Execution Endpoints

#### Trigger Workflow Execution
```http
POST /api/v1/workflows/{workflow_id}/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "input_data": { /* workflow input */ },
  "async": true
}

Response 202:
{
  "success": true,
  "data": {
    "execution_id": "uuid",
    "status": "pending",
    "message": "Workflow execution queued"
  }
}
```

#### Get Execution Status
```http
GET /api/v1/executions/{execution_id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "running",
    "trigger_type": "manual",
    "started_at": "2024-01-06T00:00:00Z",
    "completed_at": null,
    "duration_ms": null,
    "input_data": { /* input */ },
    "output_data": null,
    "nodes": [
      {
        "node_id": "node-1",
        "node_name": "Email Trigger",
        "status": "success",
        "completed_at": "2024-01-06T00:00:01Z"
      },
      {
        "node_id": "node-2",
        "node_name": "AI Response",
        "status": "running",
        "started_at": "2024-01-06T00:00:02Z"
      }
    ]
  }
}
```

#### List Executions
```http
GET /api/v1/workflows/{workflow_id}/executions
Authorization: Bearer {token}
Query Parameters:
  - page: integer (default: 1)
  - limit: integer (default: 20)
  - status: 'pending' | 'running' | 'success' | 'failed' (optional)

Response 200:
{
  "success": true,
  "data": {
    "executions": [ /* execution objects */ ],
    "pagination": { /* pagination info */ }
  }
}
```

#### Cancel Execution
```http
POST /api/v1/executions/{execution_id}/cancel
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "message": "Execution cancelled"
  }
}
```

#### Retry Execution
```http
POST /api/v1/executions/{execution_id}/retry
Authorization: Bearer {token}

Response 202:
{
  "success": true,
  "data": {
    "execution_id": "new_uuid",
    "message": "Execution retry queued"
  }
}
```

### Integration Endpoints

#### List Available Integrations
```http
GET /api/v1/integrations/available
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "integrations": [
      {
        "app_id": "slack",
        "app_name": "Slack",
        "description": "Team communication",
        "icon_url": "https://...",
        "capabilities": {
          "triggers": ["new_message", "new_channel"],
          "actions": ["send_message", "create_channel"]
        }
      }
    ]
  }
}
```

#### List User Integrations
```http
GET /api/v1/integrations
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "uuid",
        "app_id": "slack",
        "app_name": "Slack",
        "is_connected": true,
        "is_active": true,
        "last_verified_at": "2024-01-06T00:00:00Z"
      }
    ]
  }
}
```

#### Connect Integration
```http
POST /api/v1/integrations/{app_id}/connect
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "oauth_url": "https://accounts.zapier.com/authorize?..."
  }
}
```

#### Disconnect Integration
```http
DELETE /api/v1/integrations/{integration_id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "message": "Integration disconnected"
  }
}
```

### Webhook Endpoints

#### Create Webhook
```http
POST /api/v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "workflow_id": "uuid",
  "name": "Email Webhook",
  "integration_id": "uuid",
  "config": {
    "filters": { /* webhook filters */ }
  }
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "webhook_url": "https://api.jobsprint.io/webhooks/{webhook_id}",
    "secret": "webhook_secret",
    "workflow_id": "uuid",
    "name": "Email Webhook",
    "is_active": true
  }
}
```

#### List Webhooks
```http
GET /api/v1/webhooks
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "webhooks": [ /* webhook objects */ ]
  }
}
```

#### Delete Webhook
```http
DELETE /api/v1/webhooks/{webhook_id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "message": "Webhook deleted"
  }
}
```

### AI Endpoints

#### List AI Models
```http
GET /api/v1/ai/models
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5 Turbo",
        "provider": "openai",
        "context_window": 4096,
        "is_free": true,
        "capabilities": ["chat", "completion"]
      },
      {
        "id": "code-davinci-002",
        "name": "Code Davinci",
        "provider": "openai",
        "context_window": 8000,
        "is_free": true,
        "capabilities": ["completion", "code"]
      }
    ]
  }
}
```

#### Send AI Request
```http
POST /api/v1/ai/completions
Authorization: Bearer {token}
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "model": "gpt-3.5-turbo",
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "I'm doing well, thank you!"
        },
        "finish_reason": "stop",
        "usage": {
          "prompt_tokens": 10,
          "completion_tokens": 20,
          "total_tokens": 30
        }
      }
    ]
  }
}
```

#### Get AI History
```http
GET /api/v1/ai/history
Authorization: Bearer {token}
Query Parameters:
  - page: integer
  - limit: integer
  - model: string (optional)

Response 200:
{
  "success": true,
  "data": {
    "history": [ /* AI conversation objects */ ],
    "pagination": { /* pagination */ }
  }
}
```

### Admin Endpoints

#### System Health
```http
GET /api/v1/admin/health
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "rabbitmq": "healthy",
      "n8n": "healthy"
    },
    "metrics": {
      "active_workflows": 150,
      "executions_last_24h": 1500,
      "active_users": 45
    }
  }
}
```

#### System Metrics
```http
GET /api/v1/admin/metrics
Authorization: Bearer {admin_token}
Query Parameters:
  - from: ISO timestamp
  - to: ISO timestamp
  - granularity: 'hour' | 'day' | 'week'

Response 200:
{
  "success": true,
  "data": {
    "executions": {
      "total": 5000,
      "successful": 4750,
      "failed": 250,
      "success_rate": 95.0
    },
    "ai_usage": {
      "total_tokens": 1500000,
      "total_requests": 5000
    },
    "integrations": {
      "active": 120,
      "total_calls": 10000
    }
  }
}
```

## API Authentication

### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "iat": 1704508800,
    "exp": 1704595200
  }
}
```

### Authentication Headers
```http
Authorization: Bearer {jwt_token}
X-Request-ID: {uuid}
```

## Rate Limiting

### Rate Limit Rules
| User Tier | Requests/Minute | Requests/Hour |
|-----------|-----------------|---------------|
| Free      | 60              | 1000          |
| Pro       | 120             | 5000          |
| Enterprise| Unlimited       | Unlimited     |

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704508900
```

### Rate Limit Error Response
```http
HTTP 429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "retry_after": 30
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request payload |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

## WebSocket API

### Connection Endpoint
```
wss://api.jobsprint.io/ws
Authorization: Bearer {token}
```

### Event Types
```json
// Client subscribes to events
{
  "action": "subscribe",
  "channels": ["workflow:execution_updated", "user:notification"]
}

// Server pushes updates
{
  "event": "workflow.execution_updated",
  "data": {
    "execution_id": "uuid",
    "workflow_id": "uuid",
    "status": "running",
    "current_node": "AI Response",
    "progress": 50
  }
}
```

## API Versioning Strategy

### URL Versioning
- Current: `/api/v1/`
- Future: `/api/v2/`
- Deprecation: 6-month notice period

### Backward Compatibility
- Additive changes only in minor versions
- Breaking changes require major version bump
- Sunset policy: 12 months after deprecation

## Next Architecture Documents
- [Security Architecture](./07-security-architecture.md)
- [Deployment Architecture](./08-deployment-architecture.md)
- [Scalability Strategy](./09-scalability-strategy.md)
