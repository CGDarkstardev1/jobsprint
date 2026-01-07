# Data Flow Diagrams

## Overview

This document describes how data flows through the Jobsprint platform, including request flows, data transformations, and persistence patterns.

## Data Flow Principles

### 1. Unidirectional Data Flow
- **Request Flow**: Client → API Gateway → Service → Data Layer → External Service
- **Response Flow**: External Service → Data Layer → Service → API Gateway → Client
- **Event Flow**: Service → Message Queue → Worker Service → Data Layer

### 2. Data Transformation Layers
- **API Layer**: Request validation, authentication, rate limiting
- **Service Layer**: Business logic, data aggregation, transformation
- **Data Layer**: Persistence, caching, retrieval
- **Integration Layer**: External API calls, data mapping

### 3. Data Consistency
- **Strong Consistency**: PostgreSQL transactions for critical data
- **Eventual Consistency**: Redis cache with TTL invalidation
- **Best Effort**: Message queue with at-least-once delivery

## Primary Data Flows

### 1. User Registration & Authentication Data Flow

```mermaid
flowchart TD
    Start([User Registration]) --> Input[User Input<br/>Email + Password]
    Input --> Validation{Validate Input}
    Validation -->|Invalid| Error1[Return Validation Error]
    Validation -->|Valid| PuterAuth[Puter.js Auth API]
    PuterAuth --> CreateUser[Create User Record]
    CreateUser --> PGWrite[(PostgreSQL<br/>INSERT users)]
    PGWrite --> CreateSession[Create Session]
    CreateSession --> RedisWrite[(Redis<br/>SET session)]
    RedisWrite --> GenerateToken[Generate JWT Token]
    GenerateToken --> CacheToken[Cache Token in Redis]
    CacheToken --> ReturnToken[Return Token to Client]
    ReturnToken --> End([Registration Complete])

    CreateUser --> Audit[Audit Log]
    Audit --> PGWrite2[(PostgreSQL<br/>INSERT audit_logs)]

    style Start fill:#e1f5ff
    style End fill:#e1ffe1
    style PGWrite fill:#0984e3
    style PGWrite2 fill:#0984e3
    style RedisWrite fill:#00b894
```

**Data Transformations:**
1. **Password**: Hashed with bcrypt (10 rounds) before storage
2. **Email**: Lowercased and trimmed
3. **User ID**: UUID v4 generated
4. **Token**: JWT with 24-hour expiration
5. **Session**: Redis key format `session:{userId}` with 24h TTL

### 2. Workflow Creation Data Flow

```mermaid
flowchart TD
    Start([Create Workflow]) --> ClientRequest[Client POST Request<br/>Workflow Definition]
    ClientRequest --> AuthN{Authenticate}
    AuthN -->|Invalid| Error1[401 Unauthorized]
    AuthN -->|Valid| Validate[Validate Schema]
    Validate -->|Invalid| Error2[400 Validation Error]
    Validate -->|Valid| Enrich[Enrich with Metadata]
    Enrich --> PGWrite1[(PostgreSQL<br/>INSERT workflows)]
    PGWrite1 --> n8nImport[Import to n8n]
    n8nImport --> n8nAPI[n8n API Call]
    n8nAPI --> n8nSuccess{Success?}
    n8nSuccess -->|No| Rollback[Rollback PostgreSQL]
    n8nSuccess -->|Yes| Cache[Cache in Redis]
    Cache --> CacheWrite[(Redis<br/>SET workflow:ID)]
    CacheWrite --> Audit[Audit Log]
    Audit --> PGWrite2[(PostgreSQL<br/>INSERT audit_logs)]
    PGWrite2 --> Response[Return Workflow Object]
    Response --> End([Workflow Created])

    style Start fill:#e1f5ff
    style End fill:#e1ffe1
    style PGWrite1 fill:#0984e3
    style PGWrite2 fill:#0984e3
    style CacheWrite fill:#00b894
```

**Data Transformations:**
1. **Workflow ID**: UUID v4
2. **Nodes**: Validated against node registry schema
3. **Connections**: DAG validation (no cycles)
4. **Credentials**: Encrypted with AES-256-GCM
5. **Metadata**: Auto-populate (created_at, updated_at, version)

### 3. Workflow Execution Data Flow

```mermaid
flowchart TD
    Start([Trigger Workflow]) --> Trigger{Trigger Type}
    Trigger -->|Manual| ManualExec[Manual Execution]
    Trigger -->|Scheduled| ScheduledExec[Scheduler Pickup]
    Trigger -->|Webhook| WebhookExec[Webhook Received]

    ManualExec --> ValidateAccess{User Has Access?}
    ScheduledExec --> ValidateAccess
    WebhookExec --> ValidateWebhook{Valid Webhook?}

    ValidateAccess -->|No| Error1[403 Forbidden]
    ValidateWebhook -->|No| Error2[401 Invalid Signature]
    ValidateAccess -->|Yes| ValidateWebhook

    ValidateWebhook -->|Yes| CreateExec[Create Execution Record]
    CreateExec --> PGWrite1[(PostgreSQL<br/>INSERT executions)]

    PGWrite1 --> Enqueue[Enqueue Job]
    Enqueue --> MQPublish[(RabbitMQ<br/>Publish Job)]

    MQPublish --> Worker[Worker Process]
    Worker --> LockAcquire[Acquire Distributed Lock]
    LockAcquire --> Lock{Lock Acquired?}
    Lock -->|No| Retry[Retry in 5s]
    Lock -->|Yes| LoadWorkflow[Load Workflow]

    LoadWorkflow --> CacheCheck{Redis Cache?}
    CacheCheck -->|Yes| CacheGet[(Redis GET)]
    CacheCheck -->|No| DBGet[(PostgreSQL GET)]
    CacheGet --> ParseNodes[Parse Nodes]
    DBGet --> ParseNodes

    ParseNodes --> ExecuteDAG[Execute DAG]
    ExecuteDAG --> NodeLoop{For Each Node}

    NodeLoop --> NodeType{Node Type}
    NodeType -->|AI| AINode[Execute AI Node]
    NodeType -->|Integration| IntegNode[Execute Integration]
    NodeType -->|Logic| LogicNode[Execute Logic]

    AINode --> AIResponse[Get AI Response]
    AIResponse --> SaveResult
    IntegNode --> APIResponse[Call External API]
    APIResponse --> SaveResult
    LogicNode --> LogicResult[Process Logic]
    LogicResult --> SaveResult

    SaveResult[Save Node Result] --> PGWrite2[(PostgreSQL<br/>UPDATE execution_nodes)]
    PGWrite2 --> NodeLoop

    NodeLoop -->|Complete| UpdateStatus[Update Execution Status]
    UpdateStatus --> PGWrite3[(PostgreSQL<br/>UPDATE executions)]
    PGWrite3 --> CacheUpdate[(Redis<br/>UPDATE status)]
    CacheUpdate --> Notify[Notify Client]
    Notify --> WebSocket[WebSocket Push]
    WebSocket --> End([Execution Complete])

    Retry --> Lock

    style Start fill:#e1f5ff
    style End fill:#e1ffe1
    style PGWrite1 fill:#0984e3
    style PGWrite2 fill:#0984e3
    style PGWrite3 fill:#0984e3
    style CacheGet fill:#00b894
    style CacheUpdate fill:#00b894
    style MQPublish fill:#e17055
```

**Data Transformations:**
1. **Execution ID**: UUID v4
2. **Input Data**: JSON schema validation
3. **Node Output**: Serialized to JSON, max 10MB per node
4. **Error Handling**: Stack traces sanitized before storage
5. **Status Updates**: Published to Redis Pub/Sub

### 4. AI Request/Response Data Flow

```mermaid
flowchart TD
    Start([AI Node Execution]) --> GetTemplate[Get Prompt Template]
    GetTemplate --> TemplateCache{Redis Cache?}
    TemplateCache -->|Yes| CacheGet[(Redis GET)]
    TemplateCache -->|No| DBGet[(PostgreSQL GET)]
    CacheGet --> Render[Render Template]
    DBGet --> Render

    Render --> GetContext[Get Conversation Context]
    GetContext --> ContextCache{Redis Cache?}
    ContextCache -->|Yes| ContextGet[(Redis GET)]
    ContextCache -->|No| ContextDB[(PostgreSQL GET)]
    ContextGet --> TokenCount[Count Tokens]
    ContextDB --> TokenCount

    TokenCount --> WindowCheck{Within Window?}
    WindowCheck -->|No| Truncate[Truncate History]
    WindowCheck -->|Yes| BuildRequest[Build AI Request]
    Truncate --> BuildRequest

    BuildRequest --> ModelSelect[Select Model]
    ModelSelect --> RateCheck{Rate Limit?}
    RateCheck -->|Yes| Error[Return 429 Error]
    RateCheck -->|No| APIRequest[Call Free AI API]

    APIRequest --> AICall[Free AI Endpoint]
    AICall --> AIResponse{Response?}
    AIResponse -->|Error| Retry{Retry Count < 3?}
    AIResponse -->|Success| ParseResponse[Parse Response]

    Retry -->|Yes| APIRequest
    Retry -->|No| Fallback[Fallback Model]

    Fallback --> FallbackCall[Call Fallback Model]
    FallbackCall --> ParseResponse

    ParseResponse --> Validate{Valid Response?}
    Validate -->|No| Error2[Return 500 Error]
    Validate -->|Yes| SaveHistory[Save to History]
    SaveHistory --> PGWrite[(PostgreSQL<br/>INSERT ai_history)]
    PGWrite --> CacheResult[Cache Result]
    CacheResult --> RedisSet[(Redis SET)]
    RedisSet --> End([Return AI Response])

    style Start fill:#e1f5ff
    style End fill:#e1ffe1
    style CacheGet fill:#00b894
    style ContextGet fill:#00b894
    style RedisSet fill:#00b894
    style DBGet fill:#0984e3
    style PGWrite fill:#0984e3
```

**Data Transformations:**
1. **Template**: Handlebars rendering with variables
2. **Context**: Last N messages within token limit (4096 tokens)
3. **Request**: JSON with model, messages, temperature, max_tokens
4. **Response**: Parse JSON, extract text, metadata
5. **History**: Store user message + AI response pair

### 5. Integration Connection Data Flow

```mermaid
flowchart TD
    Start([Connect App]) --> OAuthStart[Start OAuth Flow]
    OAuthStart --> ZapierAuth[Zapier MCP Client]
    ZapierAuth --> GetURL[Get OAuth URL]
    GetURL --> ReturnURL[Return URL to Client]
    ReturnURL --> UserAuth[User Authorizes]
    UserAuth --> Callback[OAuth Callback]
    Callback --> ExchangeCode[Exchange Code for Token]
    ExchangeCode --> ZapierToken[Zapier Token API]
    ZapierToken --> AccessToken{Access Token?}
    AccessToken -->|No| Error[Return Error]
    AccessToken -->|Yes| Encrypt[Encrypt Token]
    Encrypt --> KeyVault[Key Encryption Key]
    KeyVault --> EncryptedToken[AES-256-GCM Encrypted]

    EncryptedToken --> SaveCreds[Save Credentials]
    SaveCreds --> PGWrite[(PostgreSQL<br/>INSERT credentials)]
    PGWrite --> CacheCreds[Cache in Redis]
    CacheCreds --> RedisSet[(Redis SET)]

    RedisSet --> TestConn[Test Connection]
    TestConn --> TestAPI[Zapier API Test]
    TestAPI --> TestSuccess{Success?}
    TestSuccess -->|No| DeleteCreds[Delete Credentials]
    TestSuccess -->|Yes| Activate[Activate Integration]
    DeleteCreds --> Error2[Return Error]

    Activate --> Audit[Audit Log]
    Audit --> PGWrite2[(PostgreSQL<br/>INSERT audit_logs)]
    PGWrite2 --> Success[Return Success]
    Success --> End([Integration Connected])

    style Start fill:#e1f5ff
    style End fill:#e1ffe1
    style PGWrite fill:#0984e3
    style PGWrite2 fill:#0984e3
    style RedisSet fill:#00b894
```

**Data Transformations:**
1. **OAuth State**: Random UUID for CSRF protection
2. **Access Token**: Encrypted with app-specific key
3. **Refresh Token**: Encrypted separately
4. **Credentials**: Stored as JSON blob in PostgreSQL
5. **Cache**: Key format `integration:{userId}:{appId}`

### 6. Webhook Processing Data Flow

```mermaid
flowchart TD
    Start([Webhook Received]) --> ParseRequest[Parse HTTP Request]
    ParseRequest --> ExtractSig[Extract Signature]
    ExtractSig --> ValidateSig{Valid Signature?}
    ValidateSig -->|No| Error1[401 Invalid Signature]
    ValidateSig -->|Yes| LookupWebhook[Lookup Webhook Config]
    LookupWebhook --> CacheCheck{Redis Cache?}
    CacheCheck -->|Yes| CacheGet[(Redis GET)]
    CacheCheck -->|No| DBGet[(PostgreSQL GET)]
    CacheGet --> WebhookConfig
    DBGet --> WebhookConfig

    WebhookConfig --> ValidatePayload[Validate Payload]
    ValidatePayload --> PayloadValid{Valid Schema?}
    PayloadValid -->|No| Error2[400 Invalid Payload]
    PayloadValid -->|Yes| Transform[Transform Data]
    Transform --> DataMap[Map to Standard Format]

    DataMap --> CreateEvent[Create Trigger Event]
    CreateEvent --> PGWrite1[(PostgreSQL<br/>INSERT trigger_events)]
    PGWrite1 --> FindWorkflows[Find Linked Workflows]
    FindWorkflows --> DBQuery[(PostgreSQL<br/>SELECT workflows)]
    DBQuery --> WorkflowList

    WorkflowList --> EnqueueExecutions[Enqueue Executions]
    EnqueueExecutions --> MQPublish[(RabbitMQ<br/>Batch Publish)]

    MQPublish --> UpdateCounter[Update Counter]
    UpdateCounter --> RedisIncr[(Redis INCR)]
    RedisIncr --> ReturnAck[Return 202 Accepted]
    ReturnAck --> End([Processing Complete])

    style Start fill:#e1f5ff
    style End fill:#e1ffe1
    style CacheGet fill:#00b894
    style RedisIncr fill:#00b894
    style DBGet fill:#0984e3
    style PGWrite1 fill:#0984e3
    style DBQuery fill:#0984e3
    style MQPublish fill:#e17055
```

**Data Transformations:**
1. **Signature**: HMAC-SHA256 validation
2. **Payload**: JSON schema validation against app schema
3. **Event ID**: UUID v4
4. **Data Mapping**: Transform to standard internal format
5. **Batching**: RabbitMQ batch publish for efficiency

## Data Flow Patterns

### 1. Request Validation Pattern
```
Client Request → Schema Validation → Auth Check → Rate Limit → Business Logic
```

### 2. Cache-Aside Pattern
```
Request → Check Cache → Cache Hit? → Return
                              → Cache Miss → Load from DB → Update Cache → Return
```

### 3. Write-Through Pattern
```
Write Request → Validate → Write to DB → Update Cache → Return
```

### 4. Event Sourcing Pattern
```
State Change → Save State → Emit Event → Event Handlers → Update Read Models
```

### 5. CQRS Pattern
```
Command (Write) → Validate → Write DB → Emit Event
Query (Read) → Check Cache → Load from Read DB → Return
```

## Data Integrity & Consistency

### Transaction Boundaries
1. **User Operations**: Single transaction across user + session
2. **Workflow Creation**: Transaction across workflow + n8n + audit
3. **Workflow Execution**: Transaction per node, eventual consistency
4. **AI Requests**: Transaction for history, cache async

### Idempotency Keys
- Format: `{userId}:{resourceType}:{resourceId}:{action}`
- TTL: 24 hours
- Storage: Redis with SETNX

### Distributed Locks
- Purpose: Prevent concurrent execution of same workflow
- Implementation: Redis RedLock algorithm
- TTL: 5 minutes (auto-release)

## Data Retention & Cleanup

### Retention Policies
1. **Audit Logs**: 1 year (compliance)
2. **Executions**: 90 days (performance)
3. **AI History**: 30 days (cost)
4. **Cache**: Variable TTL (5min - 24h)

### Cleanup Jobs
1. **Daily**: Soft-delete old records
2. **Weekly**: Vacuum PostgreSQL
3. **Monthly**: Hard-delete soft-deleted records

## Next Architecture Documents
- [Database Design](./05-database-design.md)
- [API Design](./06-api-design.md)
- [Security Architecture](./07-security-architecture.md)
