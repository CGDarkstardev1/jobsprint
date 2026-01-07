# Docker & DevOps Infrastructure - Complete Setup

## Overview

This document provides a complete overview of the Docker and DevOps infrastructure for Jobsprint, including all configuration files, services, and deployment procedures.

## Project Structure

```
jobsprint/
├── docker-compose.yml              # Main Docker Compose configuration
├── docker-compose.prod.yml         # Production overrides
├── docker-compose.dev.yml          # Development overrides
├── Dockerfile                      # Multi-stage application build
├── .dockerignore                   # Docker build exclusions
├── .env.example                    # Environment variables template
│
├── config/
│   └── docker/
│       ├── postgres/
│       │   └── init.sql           # Database initialization
│       ├── redis/
│       │   └── redis.conf         # Redis configuration
│       ├── rabbitmq/
│       │   └── definitions.json   # Queue definitions
│       └── prometheus/
│           └── prometheus.yml     # Monitoring configuration
│
├── nginx/
│   ├── nginx.conf                 # Main Nginx configuration
│   └── conf.d/
│       └── jobsprint.conf         # Application routing
│
├── scripts/
│   ├── docker-manager.sh          # Docker management utility
│   ├── deploy.sh                  # Deployment script
│   ├── health-check.sh            # Health check script
│   └── wait-for-services.sh       # Service wait script
│
└── .github/
    └── workflows/
        ├── ci.yml                 # CI/CD pipeline
        └── docker-build.yml       # Docker image building
```

## Services Architecture

### Core Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **PostgreSQL** | postgres:15-alpine | 5432 | Primary database |
| **Redis** | redis:7-alpine | 6379 | Cache & message broker |
| **RabbitMQ** | rabbitmq:3.12-management | 5672, 15672 | Message queue |
| **n8n** | n8nio/n8n | 5678 | Workflow automation |
| **Jobsprint App** | Custom build | 3000 | Main application |
| **Nginx** | nginx:alpine | 80, 443 | Reverse proxy |

### Monitoring Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **Prometheus** | prom/prometheus | 9090 | Metrics collection |
| **Grafana** | grafana/grafana | 3001 | Metrics dashboard |

## Docker Compose Files

### docker-compose.yml (Base)

Contains all service definitions with default configurations suitable for development and testing.

**Key Features:**
- Health checks for all services
- Persistent volumes for data
- Custom network configuration
- Service dependencies
- Resource limits

### docker-compose.prod.yml (Production)

Production overrides with:
- Resource limits (CPU, memory)
- Logging configuration
- Restart policies
- Security hardening
- Performance tuning

### docker-compose.dev.yml (Development)

Development overrides with:
- Volume mounts for live reload
- Debug ports exposed
- Development tools (Adminer, Redis Commander)
- Less strict resource limits

## Dockerfile

Multi-stage build with:
1. **Base**: System dependencies
2. **Dependencies**: NPM packages
3. **Build**: Compile TypeScript
4. **Production**: Runtime image
5. **Development**: Development image

**Security Features:**
- Non-root user
- Minimal base image
- Security scanning
- Health checks
- Dumb-init for signals

## CI/CD Pipeline

### GitHub Actions Workflow

**Jobs:**

1. **Security Scanning**
   - Trivy vulnerability scanner
   - npm audit
   - Snyk security scan

2. **Code Quality**
   - ESLint
   - Prettier
   - TypeScript type check

3. **Testing**
   - Unit tests with coverage
   - Integration tests
   - Codecov reporting

4. **Build**
   - Multi-platform builds
   - Docker image caching
   - Tagging strategy

5. **Deployment**
   - ECS deployment
   - Database migrations
   - Health checks
   - Rollback support

6. **Performance Testing**
   - Lighthouse CI
   - k6 load tests

## Configuration Files

### Environment Variables

Located in `.env.example`, includes:
- Database credentials
- Redis configuration
- RabbitMQ settings
- JWT secrets
- API keys
- Service URLs

### PostgreSQL

**Features:**
- UUID extension
- pgcrypto for encryption
- Custom data types
- Automated timestamps
- Soft delete support
- Optimized indexes

### Redis

**Configuration:**
- AOF persistence
- Memory limit: 512MB
- LRU eviction policy
- Password authentication
- Optimized for Jobsprint

### RabbitMQ

**Setup:**
- Quorum queues for reliability
- Delivery limit: 3
- Pre-configured exchanges
- Queue definitions
- HA policies
- Message TTL

### Nginx

**Features:**
- Reverse proxy
- Load balancing
- Rate limiting
- Gzip compression
- Security headers
- WebSocket support
- SSL/TLS ready
- Static file serving

### Prometheus

**Monitoring:**
- Application metrics
- Database metrics
- Redis metrics
- RabbitMQ metrics
- Nginx metrics
- System metrics

## Deployment Scripts

### docker-manager.sh

All-in-one management tool:

```bash
./scripts/docker-manager.sh start     # Start services
./scripts/docker-manager.sh stop      # Stop services
./scripts/docker-manager.sh logs      # View logs
./scripts/docker-manager.sh health    # Health check
./scripts/docker-manager.sh backup    # Backup data
./scripts/docker-manager.sh stats     # Resource usage
```

### deploy.sh

Production deployment:

```bash
./scripts/deploy.sh production        # Deploy to production
./scripts/deploy.sh development       # Deploy to development
```

**Features:**
- Database backups
- Migration execution
- Health checks
- Rollback support
- Zero-downtime deployment

### health-check.sh

Comprehensive health checks for:
- PostgreSQL connectivity
- Redis connectivity
- RabbitMQ status
- Application health
- Nginx status
- Resource usage

## Security Best Practices

### Implemented

✅ Non-root user in containers
✅ Secrets via environment variables
✅ Network isolation
✅ Health checks
✅ Resource limits
✅ Security scanning in CI/CD
✅ Rate limiting in Nginx
✅ Security headers
✅ Password authentication
✅ TLS/SSL ready

### Recommended for Production

1. **Secrets Management**
   - Use Docker secrets
   - External secret manager (Vault, AWS Secrets)
   - Rotate credentials regularly

2. **Network Security**
   - Private networks
   - Firewall rules
   - VPN for admin access
   - IP whitelisting

3. **TLS/SSL**
   - Let's Encrypt certificates
   - Certificate auto-renewal
   - Strong cipher suites

4. **Access Control**
   - RBAC implementation
   - MFA for admin interfaces
   - Audit logging
   - Session management

## Performance Optimization

### PostgreSQL

```yaml
shared_buffers: 256MB
effective_cache_size: 1GB
maintenance_work_mem: 64MB
max_connections: 100
```

### Redis

```bash
maxmemory: 512mb
maxmemory-policy: allkeys-lru
save: 900 1 300 10 60 10000
```

### Application

```bash
NODE_OPTIONS=--max-old-space-size=2048
DB_POOL_MIN=2
DB_POOL_MAX=10
CACHE_TTL=3600
```

## Monitoring & Logging

### Metrics Collection

- **Prometheus**: Scrapes metrics every 15s
- **Grafana**: Visual dashboards
- **Application**: Custom metrics
- **Infrastructure**: Container stats

### Logging

- **JSON structured logs**
- **Centralized logging**
- **Log rotation**
- **Log aggregation ready**

### Health Checks

- **HTTP endpoints**
- **Database connectivity**
- **Cache connectivity**
- **Queue status**
- **Resource thresholds**

## Backup Strategy

### Automated Backups

```bash
# Cron job example
0 2 * * * /path/to/scripts/docker-manager.sh backup
```

### Backup Components

1. **PostgreSQL**: SQL dumps
2. **Redis**: RDB snapshots
3. **RabbitMQ**: Queue definitions
4. **n8n**: Workflow data
5. **Application**: Configuration files

### Retention Policy

- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

## Disaster Recovery

### Recovery Procedures

1. **Restore from backup**
2. **Redeploy application**
3. **Run migrations**
4. **Verify data integrity**
5. **Health checks**

### RTO/RPO

- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 24 hours

## Scaling Strategy

### Horizontal Scaling

```bash
# Scale application
docker-compose up -d --scale jobsprint-app=3

# Scale workers
docker-compose up -d --scale worker=5
```

### Vertical Scaling

Adjust resource limits in `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

## Quick Start Commands

```bash
# Initial setup
cp .env.example .env
./scripts/docker-manager.sh start

# Daily operations
./scripts/docker-manager.sh status
./scripts/docker-manager.sh logs
./scripts/docker-manager.sh health

# Maintenance
./scripts/docker-manager.sh pull
./scripts/docker-manager.sh build
./scripts/docker-manager.sh backup

# Troubleshooting
./scripts/docker-manager.sh stats
./scripts/docker-manager.sh clean
```

## Documentation

- **Quick Start**: `docs/DOCKER_QUICKSTART.md`
- **Full Guide**: `docs/DOCKER_SETUP.md`
- **This Document**: `docs/DOCKER_INFRASTRUCTURE.md`

## Support

For issues or questions:
1. Check logs: `./scripts/docker-manager.sh logs`
2. Health check: `./scripts/docker-manager.sh health`
3. Documentation: `docs/DOCKER_SETUP.md`
4. GitHub Issues: [Project Issues]

## Summary

This Docker and DevOps infrastructure provides:

✅ Complete containerized environment
✅ Multi-stage Docker builds
✅ Automated CI/CD pipeline
✅ Comprehensive monitoring
✅ Security best practices
✅ Backup and recovery
✅ Easy deployment
✅ Development and production configurations
✅ Management utilities
✅ Extensive documentation

**Ready for development, testing, and production deployment!**
