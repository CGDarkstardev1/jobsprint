# Docker & DevOps Quick Start Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB disk space

## Initial Setup (5 minutes)

```bash
# 1. Clone repository
git clone <repo-url>
cd jobsprint

# 2. Create environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Start services
./scripts/docker-manager.sh start

# 4. Verify health
./scripts/docker-manager.sh health
```

## Daily Operations

### Starting/Stopping

```bash
# Start all services
./scripts/docker-manager.sh start

# Stop all services
./scripts/docker-manager.sh stop

# Restart services
./scripts/docker-manager.sh restart

# Check status
./scripts/docker-manager.sh status
```

### Viewing Logs

```bash
# All services
./scripts/docker-manager.sh logs

# Specific service
./scripts/docker-manager.sh logs postgres
./scripts/docker-manager.sh logs jobsprint-app
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U jobsprint -d jobsprint

# Backup database
./scripts/docker-manager.sh backup

# Restore database
./scripts/docker-manager.sh restore ./backups/20240101_120000
```

### Maintenance

```bash
# Update images
./scripts/docker-manager.sh pull

# Rebuild after code changes
./scripts/docker-manager.sh build

# Clean up unused resources
./scripts/docker-manager.sh clean
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| n8n | http://localhost:5678 | - |
| RabbitMQ Management | http://localhost:15672 | admin/password |
| Grafana | http://localhost:3001 | admin/admin |
| Prometheus | http://localhost:9090 | - |

## Troubleshooting

### Services won't start

```bash
# Check what's using ports
netstat -tuln | grep -E ':(5432|6379|5672|3000|80)'

# Clean and restart
./scripts/docker-manager.sh deep-clean
./scripts/docker-manager.sh start
```

### Out of disk space

```bash
# Remove unused Docker resources
docker system prune -a --volumes
```

### View resource usage

```bash
./scripts/docker-manager.sh stats
```

## Deployment

### Development

```bash
ENVIRONMENT=development ./scripts/deploy.sh
```

### Production

```bash
# Set production environment
export ENVIRONMENT=production

# Deploy
./scripts/deploy.sh production
```

## Environment Variables

Key variables in `.env`:

```bash
# Database
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_PASSWORD=secure_password

# RabbitMQ
RABBITMQ_PASSWORD=secure_password

# Application
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

## Monitoring

```bash
# Health check
./scripts/docker-manager.sh health

# View resource usage
./scripts/docker-manager.sh stats

# View running containers
./scripts/docker-manager.sh ps
```

## Common Tasks

### Add new migration

```bash
docker-compose exec jobsprint-app npm run migrate:create
docker-compose exec jobsprint-app npm run migrate:up
```

### Access service shell

```bash
./scripts/docker-manager.sh shell postgres
./scripts/docker-manager.sh shell redis
./scripts/docker-manager.sh shell jobsprint-app
```

### Run command in service

```bash
./scripts/docker-manager.sh exec jobsprint-app npm run test
```

## Getting Help

```bash
# Show all commands
./scripts/docker-manager.sh help

# View full documentation
cat docs/DOCKER_SETUP.md
```

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION**:

1. Change all default passwords
2. Enable SSL/TLS certificates
3. Restrict network access
4. Enable authentication
5. Set up firewall rules
6. Regular security updates
7. Implement backups
8. Monitor logs

## Quick Reference

```bash
# Start
./scripts/docker-manager.sh start

# Logs
./scripts/docker-manager.sh logs [service]

# Status
./scripts/docker-manager.sh status

# Health
./scripts/docker-manager.sh health

# Stop
./scripts/docker-manager.sh stop

# Backup
./scripts/docker-manager.sh backup

# Stats
./scripts/docker-manager.sh stats

# Clean
./scripts/docker-manager.sh clean
```

## Next Steps

1. Configure `.env` with your settings
2. Set up SSL certificates for production
3. Configure automated backups
4. Set up monitoring and alerting
5. Review security settings
6. Read full documentation: `docs/DOCKER_SETUP.md`
