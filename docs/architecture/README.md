# Jobsprint Architecture

Comprehensive architecture documentation for the Jobsprint platform.

## System Overview

Jobsprint is a distributed, microservices-based automation platform built on modern cloud-native principles. The system combines serverless capabilities, workflow automation, and AI processing to provide a powerful, zero-touch automation solution.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Web UI  │  CLI/TUI  │  API Client  │  Mobile App (Future) │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Nginx Reverse Proxy  │  SSL/TLS  │  Rate Limiting  │  Auth │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Workflow Engine  │  AI Service  │  Integration Layer       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Services Layer                          │
├─────────────────────────────────────────────────────────────┤
│  n8n  │  Puter.js  │  Zapier MCP  │  Custom Services        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Redis  │  RabbitMQ  │  File Storage          │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Application (Puter.js)

**Location**: `/src/frontend/`

**Technology Stack**:
- Puter.js SDK for cloud and AI capabilities
- Vanilla JavaScript (ES6+)
- Modern CSS (Grid, Flexbox)
- Progressive Web App features

**Responsibilities**:
- User interface for workflow creation
- Real-time workflow execution monitoring
- Integration management
- User authentication and profile management

**Key Modules**:

```
src/frontend/
├── js/
│   ├── core/
│   │   ├── app.js           # Main application entry
│   │   ├── router.js        # Client-side routing
│   │   └── state.js         # State management
│   ├── ai/
│   │   ├── chat.js          # AI chat interface
│   │   ├── code.js          # Code generation
│   │   └── completion.js    # Text completion
│   ├── integrations/
│   │   ├── zapier.js        # Zapier MCP client
│   │   ├── n8n.js           # n8n bridge
│   │   └── webhooks.js      # Webhook management
│   └── ui/
│       ├── workflow-builder.js
│       ├── dashboard.js
│       └── components.js
└── css/
    ├── main.css
    └── components.css
```

### 2. Backend Services

**Location**: `/src/backend/`

**Technology Stack**:
- Node.js with Express
- TypeScript for type safety
- JWT authentication
- RESTful API design

**Responsibilities**:
- API endpoint handling
- Workflow orchestration
- Authentication and authorization
- Data persistence and caching

**Key Modules**:

```
src/backend/
├── api/
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── workflows.js     # Workflow CRUD
│   │   ├── executions.js    # Execution management
│   │   ├── integrations.js  # Integration management
│   │   └── ai.js            # AI service endpoints
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   ├── validation.js    # Request validation
│   │   └── rateLimit.js     # Rate limiting
│   └── services/
│       ├── workflow.service.js
│       ├── execution.service.js
│       └── ai.service.js
└── n8n-custom-nodes/
    ├── nodes/               # Custom n8n node definitions
    ├── credentials/         # Credential types
    ├── docs/                # Node documentation
    └── tests/               # Node tests
```

### 3. CLI and TUI

**Location**: `/src/cli/`

**Technology Stack**:
- Bash scripts for orchestration
- Gum for terminal UI
- Systemd service management

**Responsibilities**:
- System startup and shutdown
- Service health monitoring
- Log viewing and management
- Configuration management

**Key Scripts**:

```
src/cli/gum-tui/
├── puter-startup           # Start all services
├── puter-shutdown          # Stop all services
├── puter-status            # Show service status
├── puter-logs              # View logs
├── puter-config            # Manage configuration
└── puter-backup            # Backup and restore
```

### 4. Infrastructure Services

**Location**: `/src/services/`

**Docker Compose Stack**:

```yaml
services:
  # Application Services
  backend:
    image: jobsprint/backend:latest
    ports: ["3000:3000"]
    depends_on: [postgres, redis, rabbitmq]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://...
      - REDIS_URL=redis://redis:6379

  # Workflow Engine
  n8n:
    image: n8nio/n8n:latest
    ports: ["5678:5678"]
    volumes:
      - ./n8n-data:/home/node/.n8n
    environment:
      - N8N_HOST=0.0.0.0
      - WEBHOOK_URL=https://jobsprint.io

  # Database
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=jobsprint
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=jobsprint

  # Cache and Queue
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  # Message Broker
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports: ["5672:5672", "15672:15672"]
    environment:
      - RABBITMQ_DEFAULT_USER=jobsprint
      - RABBITMQ_DEFAULT_PASS=${MQ_PASSWORD}

  # Reverse Proxy
  nginx:
    image: nginx:1.24-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./config/nginx:/etc/nginx
      - ./ssl:/etc/nginx/ssl
    depends_on: [backend, n8n]
```

## Data Architecture

### Database Schema (PostgreSQL)

**Users Table**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Workflows Table**:
```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Executions Table**:
```sql
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  status VARCHAR(50) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);
```

**Integrations Table**:
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  configuration JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  connected_at TIMESTAMP DEFAULT NOW()
);
```

### Caching Strategy (Redis)

**Cache Keys**:
```
user:{user_id}                      # User profile data
workflow:{workflow_id}              # Workflow definition
execution:{execution_id}            # Execution status
integration:{integration_id}        # Integration config
auth:token:{token}                  # JWT token blacklist
rate_limit:{user_id}:{endpoint}     # Rate limit counters
```

**TTL Settings**:
- User data: 1 hour
- Workflow data: 30 minutes
- Execution status: 5 minutes
- Rate limits: 1 hour

### Message Queuing (RabbitMQ)

**Exchanges**:
- `jobsprint.direct`: Direct routing for specific workflows
- `jobsprint.topic`: Topic-based routing for events
- `jobsprint.fanout`: Broadcast to all consumers

**Queues**:
- `workflow.executions`: Workflow execution tasks
- `ai.requests`: AI model requests
- `webhook.events`: Webhook delivery
- `integrations.tasks`: Integration tasks

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Backend validates against PostgreSQL
3. Generate JWT access token (15 min expiry)
4. Generate refresh token (30 day expiry)
5. Return tokens to client
6. Client includes access token in API requests
7. Backend validates JWT on each request
8. Refresh token used to get new access token
```

### Authorization Model

**RBAC (Role-Based Access Control)**:

| Role | Permissions |
|------|-------------|
| `admin` | Full system access |
| `user` | Create and manage own workflows |
| `viewer` | Read-only access to workflows |
| `executor` | Execute workflows only |

**API Token Scopes**:
- `read:workflows` - Read workflow definitions
- `write:workflows` - Create and modify workflows
- `execute:workflows` - Execute workflows
- `read:executions` - Read execution history
- `manage:integrations` - Manage integrations
- `admin:all` - Full administrative access

### Data Encryption

- **Transit**: TLS 1.3 for all connections
- **At Rest**:
  - Database: AES-256 encryption
  - Redis: Optional encryption
  - File storage: Encrypted volumes
- **Secrets**: Encrypted with application key

## Workflow Execution Flow

```
┌──────────────┐
│   Trigger    │ (Webhook, Schedule, Event)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Validate   │ (Validate input, check auth)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Queue      │ (Add to execution queue)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Execute    │ (Process workflow nodes)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Process    │ (Handle AI, integrations, logic)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Complete   │ (Save results, send notifications)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Cleanup    │ (Clear temp data, update metrics)
└──────────────┘
```

## Scalability Design

### Horizontal Scaling

**Stateless Services**:
- Backend API: Multiple instances behind load balancer
- n8n workers: Distributed execution nodes
- Web workers: For CPU-intensive tasks

**Load Balancing**:
```nginx
upstream backend {
    least_conn;
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
}
```

### Database Scaling

**Read Replicas**:
```
Primary (Write)  →  Replica 1 (Read)
                   →  Replica 2 (Read)
                   →  Replica 3 (Read)
```

**Connection Pooling**:
- PgBouncer for PostgreSQL
- Redis Cluster for scaling
- Partitioned queues in RabbitMQ

### Caching Strategy

**Multi-level Cache**:
1. **Application Cache** (In-memory)
2. **Redis Cache** (Distributed)
3. **CDN Cache** (Static assets)

**Cache Invalidation**:
- Time-based (TTL)
- Event-based (publish updates)
- Cache tagging (group invalidation)

## Monitoring and Observability

### Metrics Collection

**System Metrics**:
- CPU, Memory, Disk usage
- Network I/O
- Docker container stats

**Application Metrics**:
- Request rate and latency
- Workflow execution count
- Error rate and types
- AI token usage

**Business Metrics**:
- Active users
- Workflow creations
- Integration usage
- Feature adoption

### Logging Strategy

**Structured Logging**:
```json
{
  "timestamp": "2025-01-06T12:00:00Z",
  "level": "info",
  "service": "backend",
  "workflow_id": "wf_abc123",
  "execution_id": "exec_xyz789",
  "message": "Workflow execution completed",
  "duration_ms": 5234
}
```

**Log Levels**:
- ERROR: Application errors
- WARN: Warning conditions
- INFO: Informational messages
- DEBUG: Detailed debugging info

### Distributed Tracing

**Trace Flow**:
```
Request → API Gateway → Backend → Workflow Engine → AI Service → Integration
```

**Trace ID**: Propagated through all services for end-to-end tracing.

## Disaster Recovery

### Backup Strategy

**Database Backups**:
- Full backup: Daily
- Incremental: Hourly
- Point-in-time recovery: 7-day retention

**Configuration Backups**:
- Environment variables: Hourly
- nginx configs: On change
- Docker configs: On change

### High Availability

**Service Redundancy**:
- Multiple instances per service
- Health checks and auto-restart
- Failover to standby instances

**Data Replication**:
- Database replication to secondary
- Redis cluster with replicas
- Distributed message queue

## Performance Optimization

### Database Optimization

**Indexing Strategy**:
```sql
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created_at ON executions(created_at);
```

**Query Optimization**:
- Use connection pooling
- Optimize N+1 queries
- Materialized views for complex queries
- Query result caching

### Application Optimization

**Async Processing**:
- Non-blocking I/O
- Background job queues
- Parallel processing where possible

**Memory Management**:
- Stream large datasets
- Limit in-memory caching
- Process in batches

### CDN and Static Assets

**CDN Configuration**:
- Static assets served via CDN
- Cache headers optimized
- Asset versioning for cache busting

## Next Steps

Explore specific architecture topics:

- [Deployment Architecture](./deployment.md)
- [Data Flows](./data-flows.md)
- [Component Details](./components.md)
- [Security Deep Dive](./security.md)
