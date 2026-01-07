# Docker & DevOps Infrastructure Guide

Complete Docker and CI/CD setup for Jobsprint with PostgreSQL, Redis, RabbitMQ, n8n, and Nginx.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Services](#services)
- [Environment Variables](#environment-variables)
- [Commands](#commands)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Development Environment

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment

```bash
# Copy and configure production environment
cp .env.example .env.production
# Edit .env.production with production values

# Deploy to production
./scripts/deploy.sh production
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (80/443)                        │
│                    Reverse Proxy & SSL                       │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Jobsprint   │  │     n8n      │  │  RabbitMQ    │
│     App      │  │  Workflows   │  │   (5672)     │
│    (3000)    │  │   (5678)     │  │   (15672)    │
└──────┬───────┘  └──────────────┘  └──────────────┘
       │
       ├─────────────┬──────────────┐
       ▼             ▼              ▼
┌──────────────┐ ┌─────────┐  ┌──────────┐
│ PostgreSQL   │ │  Redis  │  │ Prometheus│
│  (5432)      │ │ (6379)  │  │ (9090)   │
└──────────────┘ └─────────┘  └──────────┘
```

## Services

### Core Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **PostgreSQL** | 5432 | Primary database | `pg_isready` |
| **Redis** | 6379 | Cache & message broker | `redis-cli ping` |
| **RabbitMQ** | 5672, 15672 | Message queue (AMQP + Management) | `rabbitmq-diagnostics` |
| **n8n** | 5678 | Workflow automation | HTTP `/healthz` |
| **Jobsprint App** | 3000 | Main application | HTTP `/health` |
| **Nginx** | 80, 443 | Reverse proxy | HTTP `/health` |

### Monitoring Services (Optional)

| Service | Port | Description |
|---------|------|-------------|
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3001 | Metrics dashboard |

## Environment Variables

### Database Configuration

```bash
POSTGRES_USER=jobsprint
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=jobsprint
POSTGRES_PORT=5432
```

### Redis Configuration

```bash
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password
```

### RabbitMQ Configuration

```bash
RABBITMQ_USER=jobsprint
RABBITMQ_PASSWORD=secure_rabbitmq_password
RABBITMQ_AMQP_PORT=5672
RABBITMQ_MGMT_PORT=15672
RABBITMQ_VHOST=/jobsprint
```

### Application Configuration

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
LOG_LEVEL=info
```

## Commands

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Start with specific compose files
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f postgres

# Restart service
docker-compose restart jobsprint-app

# Execute command in container
docker-compose exec jobsprint-app sh

# Build images
docker-compose build

# Pull latest images
docker-compose pull
```

### Deployment Commands

```bash
# Deploy to development
./scripts/deploy.sh development

# Deploy to production
./scripts/deploy.sh production

# Health check all services
./scripts/health-check.sh

# Wait for services to be ready
./scripts/wait-for-services.sh
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U jobsprint -d jobsprint

# Create database backup
docker-compose exec postgres pg_dump -U jobsprint jobsprint > backup.sql

# Restore database
docker-compose exec -T postgres psql -U jobsprint jobsprint < backup.sql

# Run migrations
docker-compose exec jobsprint-app npm run migrate:up

# Rollback migrations
docker-compose exec jobsprint-app npm run migrate:down
```

### Redis Management

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Monitor Redis commands
docker-compose exec redis redis-cli MONITOR

# Check Redis info
docker-compose exec redis redis-cli INFO

# Flush all data (development only!)
docker-compose exec redis redis-cli FLUSHALL
```

### RabbitMQ Management

```bash
# Access Management UI
open http://localhost:15672
# Username: admin
# Password: (from environment)

# List queues
docker-compose exec rabbitmq rabbitmqctl list_queues

# List connections
docker-compose exec rabbitmq rabbitmqctl list_connections

# Purge queue
docker-compose exec rabbitmq rabbitmqctl purge_queue queue_name
```

## Deployment

### Production Deployment

```bash
# 1. Update environment variables
nano .env.production

# 2. Deploy using script
./scripts/deploy.sh production

# 3. Verify deployment
./scripts/health-check.sh
```

### Rolling Updates

```bash
# Pull latest images
docker-compose pull

# Update specific service
docker-compose up -d jobsprint-app

# Or use rolling restart
docker-compose up -d --no-deps --build jobsprint-app
```

### Scaling Services

```bash
# Scale application
docker-compose up -d --scale jobsprint-app=3

# Scale workers
docker-compose up -d --scale worker=5
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f jobsprint-app

# Last 100 lines
docker-compose logs --tail=100 jobsprint-app

# Since specific time
docker-compose logs --since 2024-01-01T00:00:00 jobsprint-app
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats jobsprint-postgres

# Disk usage
docker system df

# Volume usage
docker volume ls
docker volume inspect jobsprint_postgres_data
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Database health
docker exec jobsprint-postgres pg_isready -U jobsprint

# Redis health
docker exec jobsprint-redis redis-cli ping

# All services
./scripts/health-check.sh
```

## Troubleshooting

### Common Issues

#### Services won't start

```bash
# Check port conflicts
netstat -tuln | grep -E ':(5432|6379|5672|3000|80)'

# Check logs
docker-compose logs

# Remove orphaned containers
docker-compose down --remove-orphans

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

#### Database connection errors

```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready

# Check database exists
docker-compose exec postgres psql -U jobsprint -l

# Verify connection
docker-compose exec jobsprint-app nc -zv postgres 5432
```

#### Redis connection errors

```bash
# Test Redis
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Connect to Redis
docker-compose exec redis redis-cli
```

#### Out of disk space

```bash
# Clean up unused images
docker image prune -a

# Clean up unused volumes
docker volume prune

# Clean up build cache
docker builder prune

# Remove all unused data
docker system prune -a --volumes
```

#### High memory usage

```bash
# Check container memory
docker stats --no-stream

# Limit container memory
# Update docker-compose.yml with:
# deploy:
#   resources:
#     limits:
#       memory: 1G

# Restart with limits
docker-compose up -d
```

### Backup & Recovery

#### Backup All Data

```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# PostgreSQL
docker-compose exec -T postgres pg_dump -U jobsprint jobsprint > "$BACKUP_DIR/postgres.sql"

# Redis
docker-compose exec redis redis-cli SAVE
docker cp jobsprint-redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb"

# RabbitMQ
docker-compose exec rabbitmq rabbitmqctl export_definitions > "$BACKUP_DIR/rabbitmq.json"

echo "Backup completed: $BACKUP_DIR"
```

#### Restore from Backup

```bash
#!/bin/bash
BACKUP_DIR=$1

# PostgreSQL
docker-compose exec -T postgres psql -U jobsprint jobsprint < "$BACKUP_DIR/postgres.sql"

# Redis
docker-compose stop redis
docker cp "$BACKUP_DIR/redis.rdb" jobsprint-redis:/data/dump.rdb
docker-compose start redis

# RabbitMQ
docker-compose exec rabbitmq rabbitmqctl import_definitions < "$BACKUP_DIR/rabbitmq.json"
```

## Security Best Practices

1. **Change Default Passwords**: Always change default passwords in production
2. **Use SSL/TLS**: Enable HTTPS in production via Nginx
3. **Network Isolation**: Use Docker networks to isolate services
4. **Regular Updates**: Keep Docker images updated
5. **Secrets Management**: Use environment variables or secret managers
6. **Access Control**: Restrict access to management interfaces
7. **Logging**: Enable and monitor logs
8. **Backups**: Implement automated backup strategy

## Performance Tuning

### PostgreSQL

```yaml
# In docker-compose.prod.yml
command: >
  postgres
  -c shared_buffers=256MB
  -c effective_cache_size=1GB
  -c maintenance_work_mem=64MB
  -c checkpoint_completion_target=0.9
  -c wal_buffers=16MB
  -c default_statistics_target=100
  -c random_page_cost=1.1
  -c effective_io_concurrency=200
  -c work_mem=2621kB
  -c min_wal_size=1GB
  -c max_wal_size=4GB
```

### Redis

```bash
# Increase memory limit
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### Application

```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=2048

# Cluster mode
NODE_ENV=production
CLUSTER_MODE=true
WORKERS=4
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

1. Runs security scans (Trivy, Snyk)
2. Executes linting (ESLint, Prettier, TypeScript)
3. Runs tests (unit, integration)
4. Builds Docker images
5. Scans Docker images for vulnerabilities
6. Pushes to GitHub Container Registry
7. Deploys to production (on main branch)

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [RabbitMQ Docker Hub](https://hub.docker.com/_/rabbitmq)
- [n8n Documentation](https://docs.n8n.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
