# Component Interaction Diagrams

## Overview

This document describes how components interact within the Jobsprint platform, including communication protocols, data flows, and integration patterns.

## Interaction Patterns

### Synchronous Communication
- **Protocol**: HTTP/1.1 and HTTP/2
- **Format**: JSON for APIs, WebSocket for real-time
- **Pattern**: Request/Response with RESTful semantics
- **Timeout**: 30s default, configurable per endpoint

### Asynchronous Communication
- **Protocol**: AMQP over RabbitMQ
- **Pattern**: Publisher/Subscriber with competing consumers
- **Message Format**: JSON with envelope metadata
- **Delivery**: At-least-once with idempotent handlers

### Event-Driven Communication
- **Protocol**: Redis Pub/Sub
- **Pattern**: Broadcast to multiple subscribers
- **Use Cases**: Cache invalidation, real-time updates
- **Message Format**: Lightweight JSON events

## Sequence Diagrams

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant PuterSDK
    participant APIGateway
    participant Auth
    participant PostgreSQL
    participant Redis

    User->>Browser: Enter credentials
    Browser->>PuterSDK: puter.auth.signUp()
    PuterSDK->>APIGateway: POST /auth/register
    APIGateway->>Auth: Validate request
    Auth->>PostgreSQL: Create user record
    PostgreSQL-->>Auth: User created
    Auth->>Redis: Store session
    Auth->>PuterSDK: JWT token + User ID
    PuterSDK->>Browser: Store token securely
    Browser-->>User: Dashboard loaded

    Note over Browser,Redis: JWT stored in localStorage<br/>Session in Redis for 24h
```

### 2. Workflow Creation Flow

```mermaid
sequenceDiagram
    actor User
    participant WebUI
    participant APIGateway
    participant WorkflowService
    participant n8nAPI
    participant PostgreSQL
    participant Redis

    User->>WebUI: Create workflow
    WebUI->>APIGateway: POST /api/workflows
    APIGateway->>WorkflowService: Validate definition
    WorkflowService->>PostgreSQL: Save workflow draft
    WorkflowService->>n8nAPI: Import workflow JSON
    n8nAPI-->>WorkflowService: Workflow ID
    WorkflowService->>Redis: Cache workflow
    WorkflowService-->>APIGateway: Workflow created
    APIGateway-->>WebUI: Workflow object
    WebUI-->>User: Show workflow editor

    Note over WebUI,Redis: Draft saved to DB<br/>Cached in Redis for quick access
```

### 3. Workflow Execution Flow

```mermaid
sequenceDiagram
    actor User
    participant WebUI
    participant APIGateway
    participant WorkflowService
    participant n8nEngine
    participant RabbitMQ
    participant Worker
    participant AIService
    participant IntegrationService

    User->>WebUI: Trigger workflow
    WebUI->>APIGateway: POST /api/workflows/:id/execute
    APIGateway->>WorkflowService: Validate + Queue
    WorkflowService->>RabbitMQ: Publish execution job
    RabbitMQ->>Worker: Deliver job
    Worker->>n8nEngine: Start execution
    n8nEngine->>AIService: Execute AI node
    AIService-->>n8nEngine: AI response
    n8nEngine->>IntegrationService: Execute Zapier action
    IntegrationService-->>n8nEngine: Action result
    n8nEngine->>PostgreSQL: Save execution log
    n8nEngine-->>Worker: Execution complete
    Worker-->>RabbitMQ: Ack message
    Worker->>Redis: Update status
    Redis-->>WebUI: Status update (WebSocket)
    WebUI-->>User: Show results

    Note over WebUI,IntegrationService: Async execution with real-time updates
```

### 4. AI Model Request Flow

```mermaid
sequenceDiagram
    participant Workflow
    participant AIService
    participant PromptManager
    participant ContextManager
    participant ModelAdapter
    participant FreeAI
    participant Cache
    participant PostgreSQL

    Workflow->>AIService: Execute AI node
    AIService->>PromptManager: Get template
    PromptManager->>PostgreSQL: Load template
    PostgreSQL-->>PromptManager: Template content
    PromptManager-->>AIService: Rendered prompt

    AIService->>ContextManager: Build context
    ContextManager->>Cache: Check cached context
    alt Context cached
        Cache-->>ContextManager: Cached context
    else No cache
        ContextManager->>PostgreSQL: Fetch conversation history
        PostgreSQL-->>ContextManager: History
        ContextManager->>Cache: Store context
    end
    ContextManager-->>AIService: Context window

    AIService->>ModelAdapter: Select model
    ModelAdapter->>FreeAI: API request
    FreeAI-->>ModelAdapter: AI response
    ModelAdapter-->>AIService: Parsed response

    AIService->>PostgreSQL: Save to history
    AIService-->>Workflow: Final result

    Note over Workflow,PostgreSQL: Multi-level caching for performance
```

### 5. Zapier Integration Connection Flow

```mermaid
sequenceDiagram
    actor User
    participant WebUI
    participant IntegrationService
    participant ZapierMCP
    participant ZapierAPI
    participant PostgreSQL
    participant Redis

    User->>WebUI: Connect Zapier app
    WebUI->>IntegrationService: Initiate OAuth
    IntegrationService->>ZapierMCP: Request OAuth URL
    ZapierMCP->>ZapierAPI: GET /oauth/url
    ZapierAPI-->>ZapierMCP: OAuth URL
    ZapierMCP-->>IntegrationService: Return URL
    IntegrationService-->>WebUI: Redirect to OAuth
    WebUI->>ZapierAPI: User authorizes
    ZapierAPI-->>WebUI: OAuth callback
    WebUI->>IntegrationService: Exchange code
    IntegrationService->>ZapierAPI: POST /oauth/token
    ZapierAPI-->>IntegrationService: Access token
    IntegrationService->>PostgreSQL: Encrypt + store token
    IntegrationService->>Redis: Cache connection
    IntegrationService-->>WebUI: Connection success
    WebUI-->>User: Connected!

    Note over WebUI,Redis: Token encrypted at rest<br/>Cached in Redis for fast access
```

### 6. Webhook Reception Flow

```mermaid
sequenceDiagram
    participant ExternalApp
    participant Nginx
    participant WebhookReceiver
    participant RabbitMQ
    participant WorkflowService
    participant IntegrationService
    participant PostgreSQL

    ExternalApp->>Nginx: POST /webhooks/:id
    Nginx->>WebhookReceiver: Forward request
    WebhookReceiver->>IntegrationService: Validate webhook
    IntegrationService->>PostgreSQL: Verify webhook ID
    PostgreSQL-->>IntegrationService: Webhook config
    IntegrationService-->>WebhookReceiver: Valid signature

    WebhookReceiver->>RabbitMQ: Publish trigger event
    RabbitMQ->>WorkflowService: Deliver to worker
    WorkflowService->>PostgreSQL: Fetch linked workflows
    PostgreSQL-->>WorkflowService: Workflow list

    loop For each workflow
        WorkflowService->>RabbitMQ: Queue execution
        RabbitMQ-->>WorkflowService: Queued
    end

    WebhookReceiver-->>ExternalApp: 202 Accepted

    Note over ExternalApp,PostgreSQL: Async processing with ack
```

## Component Communication Matrix

| From | To | Protocol | Purpose | Sync/Async |
|------|-----|----------|---------|------------|
| Browser | API Gateway | HTTPS | API requests | Sync |
| Browser | Puter.js | HTTPS | Auth + Storage | Sync |
| API Gateway | Workflow Service | HTTP | Workflow CRUD | Sync |
| API Gateway | AI Service | HTTP | AI requests | Sync |
| API Gateway | Integration Service | HTTP | Integration CRUD | Sync |
| Workflow Service | n8n | HTTP | Execution | Sync |
| Workflow Service | RabbitMQ | AMQP | Job queue | Async |
| AI Service | Free AI | HTTPS | Model inference | Sync |
| Integration Service | Zapier | HTTPS | App actions | Sync |
| Webhook Receiver | RabbitMQ | AMQP | Trigger events | Async |
| All Services | PostgreSQL | TCP | Data persistence | Sync |
| All Services | Redis | TCP | Cache/sessions | Sync |
| All Services | RabbitMQ | AMQP | Events | Async |
| Browser | Redis | WebSocket | Real-time updates | Async |

## Service Contracts

### API Gateway Contract
```yaml
# OpenAPI 3.0 specification snippet
paths:
  /api/workflows:
    post:
      summary: Create workflow
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WorkflowCreate'
      responses:
        '201':
          description: Workflow created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Workflow'
        '400':
          description: Validation error
        '401':
          description: Unauthorized
```

### Message Queue Contract
```json
{
  "messageId": "uuid",
  "timestamp": "2024-01-06T00:00:00Z",
  "type": "workflow.execute",
  "version": "1.0",
  "payload": {
    "workflowId": "uuid",
    "executionId": "uuid",
    "input": {},
    "trigger": "manual"
  },
  "metadata": {
    "priority": "normal",
    "retryCount": 0,
    "timeout": 300000
  }
}
```

### Event Bus Contract
```json
{
  "eventId": "uuid",
  "timestamp": "2024-01-06T00:00:00Z",
  "eventType": "workflow.completed",
  "aggregateId": "workflow-id",
  "data": {
    "workflowId": "uuid",
    "executionId": "uuid",
    "status": "success",
    "duration": 5000
  }
}
```

## Error Handling & Recovery

### Retry Strategy
1. **Transient Errors** (5xx, network timeouts)
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Max retries: 5 attempts
   - Dead letter queue after max retries

2. **Permanent Errors** (4xx, validation)
   - No retry
   - Log error details
   - Notify user

3. **Circuit Breaker**
   - Open after 5 consecutive failures
   - Half-open after 60 seconds
   - Close after 3 successful requests

### Fallback Strategy
1. **AI Model Fallback**
   - Primary: Free GPT-3.5-turbo
   - Fallback: Code-Davinci
   - Last resort: Queued for retry

2. **Integration Fallback**
   - Primary: Zapier API
   - Fallback: Direct API (if available)
   - Last resort: Manual notification

## Monitoring & Observability

### Metrics Collection
- **Request metrics**: Latency, throughput, error rate
- **Workflow metrics**: Execution time, success rate, node performance
- **AI metrics**: Token usage, response time, model accuracy
- **Integration metrics**: API call count, quota usage, failures

### Distributed Tracing
- **Trace ID**: Generated at API gateway
- **Span propagation**: Across all service boundaries
- **Sampling**: 100% for errors, 10% for normal

### Logging Strategy
- **Structured logging**: JSON format
- **Log levels**: ERROR, WARN, INFO, DEBUG
- **Log aggregation**: Centralized in PostgreSQL + Elasticsearch
- **Retention**: 30 days hot, 1 year cold

## Next Architecture Documents
- [Data Flow Diagrams](./04-data-flow.md)
- [Database Design](./05-database-design.md)
- [API Design](./06-api-design.md)
