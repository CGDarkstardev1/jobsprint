# Jobsprint AI Automation Platform - Complete Specification

## Project Overview

**Jobsprint** is a comprehensive AI-powered automation platform that combines:
- **Puter.js**: Serverless cloud & AI capabilities in frontend JavaScript
- **Zapier MCP**: 30,000+ pre-authenticated workflow actions
- **n8n**: Self-hosted workflow automation engine
- **Free AI Models**: GPT-3.5-turbo, Code-Davinci, Text-Davinci
- **Beautiful TUI**: Gum-based terminal interface

## Vision Statement

Create a zero-touch, full-stack automation platform that enables anyone to build powerful AI-driven workflows without writing backend code or managing API keys.

## Architecture Goals

1. **Zero Backend Required**: Everything runs in the browser or edge
2. **Free AI Models**: No API keys or billing required
3. **Beautiful UX**: Gum TUI for system management
4. **Enterprise Ready**: Monitoring, logging, security, scaling
5. **Extensible**: Plugin architecture for custom integrations

## Core Components

### 1. Puter.js Integration Layer
- Cloud storage (user files, configs, app data)
- AI model access (chat, code, completion)
- User authentication & identity
- Database & key-value storage

### 2. Zapier MCP Integration
- 30,000+ app integrations
- Pre-authenticated connections
- Workflow triggers & actions
- Webhook handling

### 3. n8n Workflow Engine
- Visual workflow editor
- Custom nodes for Jobsprint
- Scheduling & cron jobs
- Error handling & retries

### 4. AI Service Layer
- Model abstraction (switch between free models)
- Prompt management & templates
- Context window management
- Response parsing & validation

### 5. System Management TUI (Gum)
- Service start/stop/restart
- Health monitoring dashboard
- Log viewing & filtering
- Configuration management

### 6. Infrastructure
- Docker Compose setup
- PostgreSQL (persistent data)
- Redis (caching & queues)
- RabbitMQ (message bus)
- Nginx (reverse proxy + SSL)

## Technology Stack

### Frontend
- Puter.js (cloud + AI SDK)
- Vanilla JavaScript (ES6+)
- Modern CSS (Grid, Flexbox)
- Progressive Web App support

### Backend/Services
- n8n (workflow automation)
- Node.js (n8n runtime)
- Python (custom nodes)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3.12+
- Nginx 1.24+

### Development
- Bash (setup & orchestration)
- Gum (TUI)
- Git (version control)
- GitHub Actions (CI/CD)

## Directory Structure

```
jobsprint/
├── src/                          # Source code
│   ├── frontend/                 # Puter.js web app
│   │   ├── js/                   # JavaScript modules
│   │   │   ├── core/             # Core functionality
│   │   │   ├── ai/               # AI service layer
│   │   │   ├── integrations/     # Zapier, n8n clients
│   │   │   └── ui/               # UI components
│   │   ├── css/                  # Stylesheets
│   │   └── index.html            # Entry point
│   ├── backend/                  # Backend services
│   │   ├── n8n-custom-nodes/     # Custom n8n nodes
│   │   └── api/                  # REST API endpoints
│   ├── cli/                      # Command-line interface
│   │   └── gum-tui/              # Gum TUI scripts
│   └── services/                 # Service definitions
│       ├── docker/               # Docker configs
│       └── systemd/              # Systemd service files
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
├── docs/                         # Documentation
│   ├── api/                      # API reference
│   ├── guides/                   # User guides
│   └── architecture/             # Architecture docs
├── scripts/                      # Utility scripts
│   ├── setup.sh                  # Main setup script
│   ├── install.sh                # Installation script
│   └── uninstall.sh              # Cleanup script
├── config/                       # Configuration files
│   ├── nginx/                    # Nginx configs
│   ├── supervisor/               # Supervisor configs
│   └── env/                      # Environment templates
├── openspec/                     # OpenSpec specifications
├── docker-compose.yml            # Development stack
├── Dockerfile                    # Production image
├── package.json                  # Node.js dependencies
└── README.md                     # Project overview
```

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
- [ ] Project structure & build system
- [ ] Docker Compose development stack
- [ ] Database schemas & migrations
- [ ] Basic authentication & user model

### Phase 2: Puter.js Integration
- [ ] Puter.js SDK integration
- [ ] Cloud storage layer
- [ ] AI model abstraction
- [ ] User identity & auth

### Phase 3: Workflow Engine (n8n)
- [ ] n8n installation & configuration
- [ ] Custom Jobsprint nodes
- [ ] Workflow templates
- [ ] Error handling & retries

### Phase 4: Zapier MCP Integration
- [ ] Zapier MCP client setup
- [ ] App connection management
- [ ] Trigger/action handlers
- [ ] Webhook endpoints

### Phase 5: AI Service Layer
- [ ] Model abstraction layer
- [ ] Prompt template system
- [ ] Context management
- [ ] Response validation

### Phase 6: System Management TUI
- [ ] Gum TUI framework
- [ ] Service management commands
- [ ] Health monitoring dashboard
- [ ] Log viewer & filtering

### Phase 7: Testing & Quality
- [ ] Unit test suite (90%+ coverage)
- [ ] Integration tests
- [ ] E2E tests with Playwright
- [ ] Performance benchmarks

### Phase 8: Documentation & Deployment
- [ ] API documentation
- [ ] User guides & tutorials
- [ ] Deployment guides
- [ ] CI/CD pipeline

## Success Criteria

1. **Functional**: All core features working as specified
2. **Tested**: 90%+ code coverage, all tests passing
3. **Documented**: Complete API and user documentation
4. **Performant**: <100ms API response times
5. **Secure**: No hardcoded secrets, proper auth
6. **Scalable**: Horizontal scaling support
7. **Maintainable**: Clean code, good architecture

## Next Steps

1. Review and approve this specification
2. Create detailed implementation tasks
3. Spawn parallel agents for each component
4. Begin implementation with TDD approach
5. Iterate based on testing and feedback
