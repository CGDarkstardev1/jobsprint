# Architecture Decision Records (ADRs)

## Overview

This document contains Architecture Decision Records (ADRs) for major technical decisions made during the design of Jobsprint. Each ADR follows a standard format: Context, Decision, and Consequences.

## ADR-001: Use PostgreSQL as Primary Database

### Status
Accepted

### Context
We need a relational database to store:
- User accounts and authentication data
- Workflow definitions and executions
- Integration credentials
- Audit logs for compliance

### Decision
Use PostgreSQL 15+ as the primary database with the following features:
- JSONB for flexible schema (workflow definitions, metadata)
- Full-text search capabilities
- Partitioning for large tables (audit_logs)
- Strong ACID compliance
- Excellent replication support

### Consequences

#### Positive
- Mature, battle-tested database with excellent reliability
- JSONB provides NoSQL flexibility while maintaining relational benefits
- Built-in full-text search without external dependencies
- Excellent tooling and monitoring ecosystem
- Strong community support and documentation

#### Negative
- Vertical scaling limits for write-heavy workloads
- Requires connection pooling (PgBouncer) at high concurrency
- More complex setup than NoSQL alternatives

#### Mitigation
- Implement read replicas for horizontal scaling
- Use connection pooling to manage connections
- Partition large tables by date
- Use Redis caching to reduce database load

## ADR-002: Use Redis for Caching and Sessions

### Status
Accepted

### Context
We need fast access to:
- User sessions
- Frequently accessed workflows
- Rate limiting counters
- Distributed locks
- Real-time pub/sub messages

### Decision
Use Redis 7+ with clustering for:
- Session storage (TTL: 24 hours)
- Application cache (TTL: 1 hour)
- Rate limiting (sliding window)
- Distributed locks (workflow execution)
- Pub/sub for real-time updates

### Consequences

#### Positive
- Sub-millisecond read latency
- Built-in TTL support for automatic expiration
- Pub/sub for real-time features
- Atomic operations for locks and counters
- Simple data structures (strings, hashes, lists, sets)

#### Negative
- Entire dataset must fit in memory
- Single-threaded nature can be bottleneck
- Requires clustering for high availability
- Data loss risk if persistence not configured

#### Mitigation
- Use Redis Cluster for horizontal scaling
- Configure AOF persistence for durability
- Set appropriate TTLs to manage memory
- Use LRU eviction policy for cache data
- Implement cache-aside pattern with fallback

## ADR-003: Use RabbitMQ for Message Queuing

### Status
Accepted

### Context
We need asynchronous processing for:
- Workflow execution
- Webhook processing
- AI requests
- Background jobs

### Decision
Use RabbitMQ 3.12+ for message queuing with:
- Durable queues for persistence
- Dead letter exchanges for failed messages
- Priority queues for urgent tasks
- Clustering for high availability

### Consequences

#### Positive
- Reliable message delivery (at-least-once)
- Flexible routing with exchanges
- Built-in message acknowledgment
- Dead letter queue support
- Good monitoring and management UI

#### Negative
- Additional operational complexity
- Requires cluster setup for high availability
- Message ordering not guaranteed across queues
- Potential memory issues with unbounded queues

#### Mitigation
- Set message TTL and queue length limits
- Use dead letter queues for error handling
- Monitor queue depths and consumer lag
- Implement proper message acknowledgment
- Use RabbitMQ clustering for HA

## ADR-004: Use JWT for Authentication

### Status
Accepted

### Context
We need to authenticate users across:
- Web application
- API endpoints
- External integrations
- Stateless architecture

### Decision
Use JWT (JSON Web Tokens) with:
- HS256 algorithm (HMAC-SHA256)
- 24-hour expiration
- Refresh token support
- Claims-based authorization

### Consequences

#### Positive
- Stateless authentication (no database lookup)
- Works across domains
- Easy to implement and debug
- Standard libraries available
- Supports custom claims for authorization

#### Negative
- Token revocation requires workarounds
- Larger token size than session IDs
- Security risk if secret key compromised
- No built-in token refresh mechanism

#### Mitigation
- Implement token blacklist in Redis for revocation
- Use short expiration (24 hours) with refresh tokens
- Store JWT secret securely (environment variables)
- Implement key rotation every 90 days
- Validate all claims on every request

## ADR-005: Use n8n for Workflow Engine

### Status
Accepted

### Context
We need a workflow engine to:
- Execute complex multi-step workflows
- Provide visual workflow builder
- Support 300+ integrations
- Handle scheduling and triggers

### Decision
Use n8n (Community Edition) with:
- Custom Jobsprint nodes
- Self-hosted deployment
- PostgreSQL storage
- Webhook support
- Cron scheduling

### Consequences

#### Positive
- Visual workflow builder (no-code)
- Large ecosystem of integrations
- Active community and good documentation
- Self-hosted (data control)
- Easy to extend with custom nodes

#### Negative
- Community edition lacks some features
- Scaling limitations (single instance limitation)
- Node.js performance concerns for CPU-heavy tasks
- Requires separate management interface

#### Mitigation
- Build custom Jobsprint nodes for specific needs
- Implement queue-based execution pattern
- Use worker pool for parallel execution
- Integrate with Jobsprint authentication
- Consider upgrade to Enterprise if needed

## ADR-006: Use Puter.js for Cloud + AI

### Status
Accepted

### Context
We need:
- Cloud storage for user files
- Free AI models (GPT-3.5, Code-Davinci)
- User authentication
- No backend complexity

### Decision
Use Puter.js SDK for:
- Cloud storage (user files, workflow artifacts)
- Free AI model access
- Authentication (OAuth)
- Key-value storage

### Consequences

#### Positive
- Zero backend setup required
- Free AI models (no API costs)
- Built-in authentication
- Simple JavaScript API
- Handles infrastructure complexity

#### Negative
- Vendor lock-in risk
- Limited control over AI models
- Potential rate limiting
- Dependency on external service
- Data stored on third-party servers

#### Mitigation
- Implement abstraction layer for AI services
- Cache AI responses in Redis
- Add fallback to paid AI models if needed
- Export data regularly from Puter.js
- Monitor rate limits closely

## ADR-007: Use Docker Compose for Development

### Status
Accepted

### Context
We need a development environment that:
- Replicates production closely
- Is easy to set up and tear down
- Supports hot-reload for development
- Works across different machines

### Decision
Use Docker Compose with:
- Separate containers for each service
- Volume mounts for live code editing
- Environment variables for configuration
- Docker networks for isolation

### Consequences

#### Positive
- Consistent environment across team
- Easy onboarding for new developers
- Isolated dependencies
- Simple cleanup and restart
- Matches production containerization

#### Negative
- Slower than native development
- More resource intensive
- Docker learning curve
- Potential file system issues on macOS/Windows

#### Mitigation
- Provide detailed setup documentation
- Use Docker Compose profiles for optional services
- Optimize volume mounts for performance
- Provide native fallback if needed
- Use health checks for service readiness

## ADR-008: Use Kubernetes for Production

### Status
Accepted

### Context
We need a production deployment platform that:
- Supports horizontal scaling
- Provides high availability
- Enables zero-downtime deployments
- Handles service discovery
- Manages configuration and secrets

### Decision
Use Kubernetes with:
- AWS EKS or GKE managed service
- Horizontal Pod Autoscaler
- ConfigMaps and Secrets
- Ingress controller (Nginx)
- Persistent volumes for stateful services

### Consequences

#### Positive
- Industry-standard orchestration
- Excellent scalability and HA
- Large ecosystem of tools
- Cloud-agnostic (portable)
- Built-in service discovery

#### Negative
- Steep learning curve
- Complex operational overhead
- Resource intensive (master nodes)
- Potential vendor lock-in with managed services
- Overkill for small deployments

#### Mitigation
- Use managed Kubernetes service (EKS/GKE)
- Start small, scale as needed
- Use Helm charts for repeatable deployments
- Invest in monitoring and observability
- Provide comprehensive documentation

## ADR-009: Use REST API with JSON

### Status
Accepted

### Context
We need an API that:
- Works with Puter.js constraints
- Supports browser-based applications
- Is easy to consume from any language
- Follows industry standards

### Decision
Use REST API with:
- JSON payload format
- Standard HTTP verbs (GET, POST, PUT, DELETE)
- Resource-based URLs
- OpenAPI 3.0 specification
- JWT authentication

### Consequences

#### Positive
- Universally supported
- Easy to debug and test
- Works with Puter.js and browsers
- Large ecosystem of tools
- Simple to understand

#### Negative
- Multiple round trips for related data
- Over-fetching/under-fetching issues
- No built-in real-time support
- Less efficient than GraphQL

#### Mitigation
- Implement GraphQL gateway if needed
- Use API versioning
- Provide pagination and filtering
- Consider WebSocket for real-time features
- Use batch endpoints where appropriate

## ADR-010: Use Gum for System Management TUI

### Status
Accepted

### Context
We need a terminal-based interface for:
- Service management (start/stop/restart)
- Log viewing and filtering
- Health monitoring
- Configuration management
- Developer-friendly interaction

### Decision
Use Gum (shell script TUI) with:
- Interactive menus
- Real-time status updates
- Color-coded output
- Keyboard shortcuts
- Scriptable automation

### Consequences

#### Positive
- Terminal-based (SSH friendly)
- Fast and lightweight
- Easy to script and automate
- No GUI dependencies
- Works on headless servers

#### Negative
- Limited interactivity vs GUI
- Terminal compatibility issues
- Steeper learning curve for non-developers
- Less visually appealing than web UI

#### Mitigation
- Also provide web-based admin interface
- Document keyboard shortcuts clearly
- Use common terminal features only
- Provide help text in TUI
- Make it optional, not required

## ADR-011: Implement Multi-Level Caching

### Status
Accepted

### Context
We need to optimize performance for:
- Frequently accessed workflows
- User session data
- AI responses
- Integration credentials

### Decision
Implement 3-level caching:
- L1: In-memory cache (NodeCache, 1-minute TTL)
- L2: Redis cache (1-hour TTL)
- L3: CDN cache for static assets

### Consequences

#### Positive
- Significant performance improvement
- Reduced database load
- Better user experience
- Lower infrastructure costs
- Scalable architecture

#### Negative
- Cache invalidation complexity
- Potential stale data issues
- Memory overhead for L1 cache
- Operational complexity

#### Mitigation
- Use cache-aside pattern with smart invalidation
- Implement cache warming for critical data
- Monitor cache hit rates
- Set appropriate TTLs
- Provide cache bypass for critical operations

## ADR-012: Use Zapier MCP for Integrations

### Status
Accepted

### Context
We need integration with 30,000+ third-party apps:
- Gmail, Slack, Salesforce, etc.
- OAuth authentication
- Webhook support
- Triggers and actions

### Decision
Use Zapier MCP (Model Context Protocol) with:
- Pre-authenticated connections
- 30,000+ app ecosystem
- Webhook handling
- OAuth flow management

### Consequences

#### Positive
- Massive integration catalog
- Pre-built OAuth flows
- No need to build custom integrations
- Regular updates from Zapier
- Comprehensive documentation

#### Negative
- Dependency on Zapier platform
- Potential costs at scale
- Rate limiting restrictions
- Limited control over integrations
- Vendor lock-in risk

#### Mitigation
- Build custom integrations for critical apps
- Implement rate limiting and queuing
- Cache integration responses
- Monitor usage and costs
- Keep abstraction layer for flexibility

## Decision Log Summary

| ADR | Decision | Date | Status |
|-----|----------|------|--------|
| 001 | PostgreSQL as primary database | 2024-01-06 | Accepted |
| 002 | Redis for caching and sessions | 2024-01-06 | Accepted |
| 003 | RabbitMQ for message queuing | 2024-01-06 | Accepted |
| 004 | JWT for authentication | 2024-01-06 | Accepted |
| 005 | n8n for workflow engine | 2024-01-06 | Accepted |
| 006 | Puter.js for cloud + AI | 2024-01-06 | Accepted |
| 007 | Docker Compose for development | 2024-01-06 | Accepted |
| 008 | Kubernetes for production | 2024-01-06 | Accepted |
| 009 | REST API with JSON | 2024-01-06 | Accepted |
| 010 | Gum for system management TUI | 2024-01-06 | Accepted |
| 011 | Multi-level caching | 2024-01-06 | Accepted |
| 012 | Zapier MCP for integrations | 2024-01-06 | Accepted |

## Template for Future ADRs

```markdown
## ADR-XXX: [Title]

### Status
Proposed | Accepted | Deprecated | Superseded

### Context
[What is the issue that we're seeing that is motivating this decision or change?]

### Decision
[What is the change that we're proposing and/or doing?]

### Consequences

#### Positive
- [What are the positive consequences of this decision?]

#### Negative
- [What are the negative consequences of this decision?]

#### Mitigation
- [How will we mitigate the negative consequences?]

### Related Decisions
- Links to related ADRs
```

## Next Steps
- Review and approve all ADRs
- Create ADRs for future decisions
- Revisit ADRs quarterly for relevance
- Archive deprecated decisions
```

