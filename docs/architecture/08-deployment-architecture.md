# Deployment Architecture

## Overview

Jobsprint uses container-based deployment with Docker Compose for development/staging and Kubernetes for production. The architecture supports multi-environment deployment with zero-downtime updates.

## Deployment Environments

### Environment Hierarchy

```mermaid
graph TB
    Dev[Development<br/>Local Docker Compose] --> Staging[Staging<br/>Cloud Docker Compose/K8s]
    Staging --> Prod[Production<br/>Kubernetes Cluster]

    Dev -.->|Feature branches| Dev
    Staging -.->|Pre-production testing| Staging
    Prod -.->|Live traffic| Prod

    style Dev fill:#e1f5ff
    style Staging fill:#fff4e1
    style Prod fill:#ffe1e1
```

### Environment Specifications

| Environment | Purpose | Infrastructure | Data | Deployment |
|-------------|---------|----------------|------|------------|
| Development | Local development | Docker Compose (local) | Mock/seeds | Manual |
| Staging | Pre-production testing | Docker Compose/K8s (cloud) | Sample/anonymized | CI/CD |
| Production | Live production | Kubernetes (multi-zone) | Real data | CI/CD with approvals |

## Development Deployment

### Local Docker Compose Stack

```yaml
# docker-compose.yml (Development)
version: '3.8'

services:
  # Frontend
  frontend:
    build: ./src/frontend
    ports:
      - "3000:3000"
    volumes:
      - ./src/frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PUTER_APP_ID=${PUTER_APP_ID}
      - API_URL=http://localhost:4000

  # API Gateway
  api-gateway:
    build: ./src/backend/api
    ports:
      - "4000:4000"
    volumes:
      - ./src/backend/api:/app
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://jobsprint:password@postgres:5432/jobsprint
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  # n8n Workflow Engine
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
      - WEBHOOK_URL=http://localhost:5678/
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres
      - redis

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=jobsprint
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=jobsprint
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/backend/migrations:/docker-entrypoint-initdb.d

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    environment:
      - RABBITMQ_DEFAULT_USER=jobsprint
      - RABBITMQ_DEFAULT_PASS=password
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # Nginx Reverse Proxy
  nginx:
    image: nginx:1.24-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx/dev.conf:/etc/nginx/nginx.conf
      - ./config/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api-gateway

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  n8n_data:
```

### Development Setup Script

```bash
#!/bin/bash
# scripts/dev-setup.sh

set -e

echo "🚀 Setting up Jobsprint development environment..."

# Create .env file if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env << EOF
# Puter.js Configuration
PUTER_APP_ID=your_app_id_here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Database
DATABASE_URL=postgresql://jobsprint:password@localhost:5432/jobsprint

# Redis
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
EOF
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd src/frontend && npm install && cd ../..
cd src/backend && npm install && cd ../..

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Start services
echo "🎯 Starting services..."
docker-compose up -d postgres redis rabbitmq
sleep 5
docker-compose up -d

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose exec api-gateway npm run migrate

# Seed development data
echo "🌱 Seeding development data..."
docker-compose exec api-gateway npm run seed

echo "✅ Development environment ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:4000"
echo "⚙️  n8n: http://localhost:5678"
echo "🐰 RabbitMQ: http://localhost:15672"
```

## Staging Deployment

### Cloud Docker Compose Stack

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  frontend:
    image: jobsprint/frontend:staging
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=staging
      - PUTER_APP_ID=${PUTER_APP_ID}
      - API_URL=https://staging-api.jobsprint.io

  api-gateway:
    image: jobsprint/api-gateway:staging
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}

  # Other services...
```

### Staging Deployment Pipeline

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches:
      - develop
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t jobsprint/frontend:${{ github.sha }} ./src/frontend
          docker build -t jobsprint/api-gateway:${{ github.sha }} ./src/backend/api

      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push jobsprint/frontend:${{ github.sha }}
          docker push jobsprint/api-gateway:${{ github.sha }}

      - name: Deploy to staging
        run: |
          ssh ubuntu@staging.jobsprint.io
          cd /opt/jobsprint
          docker-compose -f docker-compose.staging.yml pull
          docker-compose -f docker-compose.staging.yml up -d
          docker-compose -f docker-compose.staging.yml exec api-gateway npm run migrate
```

## Production Deployment

### Kubernetes Architecture

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            Ingress[Nginx Ingress Controller<br/>SSL Termination<br/>Load Balancing]
        end

        subgraph "Application Layer"
            subgraph "Frontend Deployment"
                FrontendPod1[Frontend Pod 1]
                FrontendPod2[Frontend Pod 2]
                FrontendPod3[Frontend Pod 3]
            end

            subgraph "API Gateway Deployment"
                APIPod1[API Gateway Pod 1]
                APIPod2[API Gateway Pod 2]
                APIPod3[API Gateway Pod 3]
            end

            subgraph "Workflow Engine Deployment"
                n8nPod1[n8n Pod 1]
                n8nPod2[n8n Pod 2]
            end

            subgraph "AI Service Deployment"
                AIPod1[AI Service Pod 1]
                AIPod2[AI Service Pod 2]
            end

            subgraph "Integration Service Deployment"
                IntPod1[Integration Pod 1]
                IntPod2[Integration Pod 2]
            end
        end

        subgraph "Data Layer"
            PGStateful[PostgreSQL StatefulSet<br/>Primary + 2 Replicas]
            RedisDeployment[Redis Cluster<br/>3 Nodes]
            RabbitMQStateful[RabbitMQ StatefulSet<br/>3 Nodes]
        end
    end

    subgraph "External"
        CloudLB[Cloud Load Balancer<br/>AWS/GCP/Azure]
        CDN[CDN<br/>CloudFlare/AWS CloudFront]
    end

    CloudLB --> Ingress
    CDN --> Ingress
    Ingress --> FrontendPod1
    Ingress --> FrontendPod2
    Ingress --> FrontendPod3
    Ingress --> APIPod1
    Ingress --> APIPod2
    Ingress --> APIPod3

    style Ingress fill:#e1f5ff
    style CloudLB fill:#ffe1e1
    style CDN fill:#ffe1f0
```

### Kubernetes Manifests

#### Namespace & ConfigMaps
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: jobsprint
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: jobsprint
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_URL: "https://api.jobsprint.io"
```

#### Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: jobsprint
type: Opaque
stringData:
  JWT_SECRET: "${JWT_SECRET}"
  DATABASE_URL: "${DATABASE_URL}"
  REDIS_URL: "${REDIS_URL}"
  PUTER_APP_ID: "${PUTER_APP_ID}"
```

#### Frontend Deployment
```yaml
# k8s/frontend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: jobsprint
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        version: v1
    spec:
      containers:
      - name: frontend
        image: jobsprint/frontend:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
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
        envFrom:
        - configMapRef:
            name: app-config
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: jobsprint
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

#### API Gateway Deployment
```yaml
# k8s/api-gateway/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: jobsprint
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: jobsprint/api-gateway:latest
        ports:
        - containerPort: 4000
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: jobsprint
spec:
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 4000
  type: ClusterIP
```

#### PostgreSQL StatefulSet
```yaml
# k8s/postgres/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: jobsprint
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          value: jobsprint
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: POSTGRES_DB
          value: jobsprint
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 20Gi
      storageClassName: fast-ssd
```

#### Ingress Configuration
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jobsprint-ingress
  namespace: jobsprint
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - jobsprint.io
    - api.jobsprint.io
    secretName: jobsprint-tls
  rules:
  - host: jobsprint.io
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
  - host: api.jobsprint.io
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 80
```

### Production Deployment Pipeline

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: |
          docker build -t jobsprint/frontend:${{ github.ref_name }} ./src/frontend
          docker build -t jobsprint/api-gateway:${{ github.ref_name }} ./src/backend/api

      - name: Push to registry
        run: |
          docker tag jobsprint/frontend:${{ github.ref_name }} jobsprint/frontend:latest
          docker tag jobsprint/api-gateway:${{ github.ref_name }} jobsprint/api-gateway:latest
          docker push jobsprint/frontend:${{ github.ref_name }}
          docker push jobsprint/frontend:latest
          docker push jobsprint/api-gateway:${{ github.ref_name }}
          docker push jobsprint/api-gateway:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://jobsprint.io
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/frontend frontend=jobsprint/frontend:${{ github.ref_name }}
          kubectl set image deployment/api-gateway api-gateway=jobsprint/api-gateway:${{ github.ref_name }}

      - name: Run migrations
        run: |
          kubectl rollout status deployment/api-gateway
          kubectl exec -it deployment/api-gateway -- npm run migrate

      - name: Verify deployment
        run: |
          kubectl get pods -l app=frontend
          kubectl get pods -l app=api-gateway
          curl -f https://jobsprint.io/health || exit 1
```

## Infrastructure as Code

### Terraform Configuration

```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "jobsprint" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "jobsprint-vpc"
    Environment = var.environment
  }
}

# EKS Cluster
resource "aws_eks_cluster" "jobsprint" {
  name     = "jobsprint-cluster"
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  tags = {
    Environment = var.environment
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "jobsprint" {
  identifier           = "jobsprint-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.large"
  allocated_storage   = 100
  storage_encrypted   = true

  db_name  = "jobsprint"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.jobsprint.name

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  tags = {
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "jobsprint" {
  cluster_id           = "jobsprint-cache"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 3
  parameter_group_name = "default.redis7"
  port                 = 6379

  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.jobsprint.name

  tags = {
    Environment = var.environment
  }
}
```

## Monitoring & Logging

### Prometheus Monitoring

```yaml
# k8s/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s

    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

    - job_name: 'postgres'
      static_configs:
      - targets: ['postgres-exporter:9187']

    - job_name: 'redis'
      static_configs:
      - targets: ['redis-exporter:9121']
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "Jobsprint Production Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_errors_total[5m])"
        }]
      },
      {
        "title": "Workflow Executions",
        "targets": [{
          "expr": "rate(workflow_executions_total[5m])"
        }]
      },
      {
        "title": "AI Response Time",
        "targets": [{
          "expr": "histogram_quantile(0.95, ai_response_time_seconds)"
        }]
      }
    ]
  }
}
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh

# PostgreSQL backup
kubectl exec -it postgres-0 -- pg_dump -U jobsprint jobsprint | gzip > backup_$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://jobsprint-backups/database/

# Retention: 30 days daily, 12 weeks weekly, 12 months monthly
```

### Recovery Procedures

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

# Download from S3
aws s3 cp s3://jobsprint-backups/database/${BACKUP_FILE} .

# Restore to PostgreSQL
gunzip -c ${BACKUP_FILE} | kubectl exec -i postgres-0 -- psql -U jobsprint jobsprint
```

## Next Architecture Documents
- [Scalability Strategy](./09-scalability-strategy.md)
- [Architecture Decision Records](./10-adrs.md)
- [Service Interfaces](./11-service-interfaces.md)
