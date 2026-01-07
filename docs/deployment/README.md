# Deployment Guide

Comprehensive guide for deploying Jobsprint to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Maintenance](#maintenance)

## Prerequisites

Before deploying, ensure you have:

- **Domain Name**: For SSL certificates and access
- **Server**: Ubuntu 20.04+ or Debian 11+
- **Resources**:
  - Minimum: 2 CPU, 4GB RAM, 20GB disk
  - Recommended: 4 CPU, 8GB RAM, 50GB disk
- **SSL Certificate**: Let's Encrypt or custom certificate
- **Database**: PostgreSQL 15+ (external or managed)
- **Email Service**: SMTP access (optional, for notifications)

## Deployment Options

Jobsprint supports several deployment strategies:

### 1. Single Server Deployment

**Best for**: Small teams, MVPs, testing

**Architecture**:
```
Single Server (Docker Compose)
├── Nginx (80, 443)
├── Backend API (3000)
├── n8n (5678)
├── PostgreSQL (5432)
├── Redis (6379)
└── RabbitMQ (5672)
```

**Pros**:
- Simple setup
- Low cost
- Easy management

**Cons**:
- Single point of failure
- Limited scalability
- Resource contention

### 2. Distributed Deployment

**Best for**: Production, high availability

**Architecture**:
```
Load Balancer
├── Web Server 1
├── Web Server 2
└── Web Server 3
    ↓
Database Cluster
├── Primary (Write)
├── Replica 1 (Read)
└── Replica 2 (Read)
```

**Pros**:
- High availability
- Better performance
- Scalable

**Cons**:
- Complex setup
- Higher cost
- More maintenance

### 3. Cloud Platform Deployment

**Best for**: Enterprise, auto-scaling

**Platforms**:
- AWS (ECS, EKS)
- Google Cloud (GKE, Cloud Run)
- Azure (AKS, Container Instances)
- DigitalOcean (App Platform)

**Pros**:
- Managed infrastructure
- Auto-scaling
- High availability
- Built-in monitoring

**Cons**:
- Vendor lock-in
- Learning curve
- Cost at scale

## Production Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git docker.io docker-compose nginx

# Add user to docker group
sudo usermod -aG docker $USER

# Enable services
sudo systemctl enable docker nginx
```

### Step 2: DNS Configuration

Add DNS records:

```
A Record: jobsprint.yourdomain.com → SERVER_IP
A Record: api.jobsprint.yourdomain.com → SERVER_IP
A Record: n8n.jobsprint.yourdomain.com → SERVER_IP
```

### Step 3: SSL Certificates

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d jobsprint.yourdomain.com \
  -d api.jobsprint.yourdomain.com \
  -d n8n.jobsprint.yourdomain.com

# Auto-renewal (configured automatically)
sudo certbot renew --dry-run
```

### Step 4: Clone and Configure

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/jobsprint/jobsprint.git
cd jobsprint

# Copy environment template
sudo cp config/env/.env.example config/env/.env

# Edit configuration
sudo nano config/env/.env
```

### Step 5: Environment Variables

Edit `.env` file:

```bash
# Application
NODE_ENV=production
DOMAIN=jobsprint.yourdomain.com
API_URL=https://api.jobsprint.yourdomain.com

# Secrets (generate strong random strings)
JWT_SECRET=your_jwt_secret_here_64_chars_min
ENCRYPTION_KEY=your_encryption_key_here_32_chars
SESSION_SECRET=your_session_secret_here_64_chars

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=jobsprint
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=jobsprint

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=jobsprint
RABBITMQ_PASSWORD=your_mq_password

# n8n
N8N_HOST=n8n.jobsprint.yourdomain.com
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_PATH=/
WEBHOOK_URL=https://jobsprint.yourdomain.com/

# Puter.js
PUTER_API_KEY=your_puter_api_key
PUTER_APP_ID=your_puter_app_id
```

### Step 6: Configure Nginx

```bash
# Copy nginx configuration
sudo cp config/nginx/jobsprint.conf /etc/nginx/sites-available/jobsprint

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/jobsprint /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Nginx Configuration** (`/etc/nginx/sites-available/jobsprint`):

```nginx
# Upstream for backend API
upstream backend {
    least_conn;
    server backend:3000;
}

# Upstream for n8n
upstream n8n {
    server n8n:5678;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name jobsprint.yourdomain.com api.jobsprint.yourdomain.com n8n.jobsprint.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main application
server {
    listen 443 ssl http2;
    server_name jobsprint.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/jobsprint.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jobsprint.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API subdomain
server {
    listen 443 ssl http2;
    server_name api.jobsprint.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.jobsprint.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.jobsprint.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# n8n subdomain
server {
    listen 443 ssl http2;
    server_name n8n.jobsprint.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/n8n.jobsprint.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.jobsprint.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://n8n;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 7: Start Services

```bash
# Build containers
docker-compose build

# Start services in detached mode
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 8: Initialize Database

```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# Seed database
docker-compose exec backend npm run db:seed

# Create admin user
docker-compose exec backend npm run user:create \
  --email=admin@yourdomain.com \
  --password=your_secure_password \
  --role=admin
```

### Step 9: Verify Deployment

```bash
# Check health endpoint
curl https://api.jobsprint.yourdomain.com/api/v1/health

# Check all services
sudo puter-status
```

## Docker Deployment

### Docker Compose Configuration

**Production Docker Compose** (`docker-compose.prod.yml`):

```yaml
version: '3.8'

services:
  backend:
    image: jobsprint/backend:latest
    restart: always
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
      - rabbitmq
    volumes:
      - ./logs:/app/logs
    networks:
      - jobsprint-network

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - jobsprint-network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - jobsprint-network

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    restart: always
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_USER}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - jobsprint-network

volumes:
  postgres-data:
  redis-data:
  rabbitmq-data:

networks:
  jobsprint-network:
    driver: bridge
```

### Building Images

```bash
# Build production images
docker build -t jobsprint/backend:latest -f Dockerfile.backend .

# Tag and push to registry
docker tag jobsprint/backend:latest registry.example.com/jobsprint/backend:latest
docker push registry.example.com/jobsprint/backend:latest
```

## Kubernetes Deployment

### Deployment Manifest

**Deployment** (`k8s/deployment.yaml`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jobsprint-backend
  labels:
    app: jobsprint-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jobsprint-backend
  template:
    metadata:
      labels:
        app: jobsprint-backend
    spec:
      containers:
      - name: backend
        image: jobsprint/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: jobsprint-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: jobsprint-backend-service
spec:
  selector:
    app: jobsprint-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Ingress** (`k8s/ingress.yaml`):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jobsprint-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - jobsprint.yourdomain.com
    secretName: jobsprint-tls
  rules:
  - host: jobsprint.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: jobsprint-backend-service
            port:
              number: 80
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace jobsprint

# Create secrets
kubectl create secret generic jobsprint-secrets \
  --from-literal=database-url="postgres://..." \
  --from-literal=jwt-secret="..." \
  -n jobsprint

# Apply manifests
kubectl apply -f k8s/ -n jobsprint

# Check deployment
kubectl get pods -n jobsprint

# View logs
kubectl logs -f deployment/jobsprint-backend -n jobsprint
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Environment (production/development) |
| `DOMAIN` | Yes | Primary domain |
| `JWT_SECRET` | Yes | JWT signing secret |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `REDIS_PASSWORD` | Yes | Redis password |
| `RABBITMQ_PASSWORD` | Yes | RabbitMQ password |

### Security Best Practices

1. **Secrets Management**:
   ```bash
   # Use Docker secrets
   docker secret create jwt_secret jwt_secret.txt

   # Or use Kubernetes secrets
   kubectl create secret generic jwt-secret --from-file=jwt.txt
   ```

2. **Firewall Configuration**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

3. **Database Access**:
   - Restrict to localhost
   - Use strong passwords
   - Enable SSL connections

4. **Rate Limiting**:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   limit_req zone=api burst=20;
   ```

## Monitoring

### Health Checks

**Health Endpoint**: `/api/v1/health`

```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T12:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy"
  }
}
```

### Metrics Collection

**Prometheus Integration**:

```yaml
# docker-compose.yml
backend:
  # ...
  labels:
    - "prometheus.io/scrape=true"
    - "prometheus.io/port=3000"
    - "prometheus.io/path=/metrics"
```

### Logging

**Centralized Logging** (ELK Stack):

```bash
# Filebeat configuration
output.elasticsearch:
  hosts: ["elasticsearch:9200"]

processors:
  - add_cloud_metadata:

filebeat.inputs:
  - type: docker
    containers.ids: '*'
    paths:
      - '/var/lib/docker/containers/*/*.log'
```

## Maintenance

### Backup Strategy

**Database Backup**:

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U jobsprint jobsprint > "$BACKUP_DIR/backup_$DATE.sql"

# Keep last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

**Add to crontab**:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/jobsprint/scripts/backup.sh
```

### Updates and Upgrades

```bash
# Pull latest code
git pull origin master

# Pull latest images
docker-compose pull

# Rebuild if needed
docker-compose build

# Restart services
docker-compose down
docker-compose up -d

# Run migrations
docker-compose exec backend npm run db:migrate
```

### Scaling

**Horizontal Scaling**:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

**Database Scaling**:

- Add read replicas
- Use connection pooling (PgBouncer)
- Partition large tables

## Troubleshooting

### Common Issues

**Services Won't Start**:
```bash
# Check logs
docker-compose logs backend

# Check resource usage
docker stats

# Restart services
docker-compose restart
```

**Database Connection Errors**:
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend ping postgres
```

**High Memory Usage**:
```bash
# Check memory usage
docker stats --no-stream

# Restart services
docker-compose restart

# Add memory limits in docker-compose.yml
```

## Next Steps

- Set up monitoring alerts
- Configure disaster recovery
- Implement CI/CD pipeline
- Performance optimization

For more information, see:
- [Operations Runbook](./operations-runbook.md)
- [Architecture Documentation](../architecture/README.md)
- [API Reference](../api/README.md)
