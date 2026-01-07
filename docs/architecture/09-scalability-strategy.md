# Scalability Strategy

## Overview

Jobsprint is designed for horizontal scalability with stateless services, distributed caching, and load balancing. This document outlines the comprehensive scaling strategy.

## Scalability Principles

### 1. Horizontal Scaling
- **Stateless Services**: Scale API Gateway, AI Service, Integration Service independently
- **Load Balancing**: Distribute traffic across instances
- **Auto-scaling**: Scale based on CPU, memory, and request metrics

### 2. Vertical Scaling
- **Database**: Read replicas for PostgreSQL, Redis clustering
- **Message Queue**: RabbitMQ clustering with mirrored queues
- **Cache**: Multi-level caching with Redis cluster

### 3. Caching Strategy
- **Application Cache**: Redis for hot data
- **CDN Cache**: Static assets served from edge locations
- **Database Cache**: Query result caching with intelligent invalidation

## Scaling Architecture

```mermaid
graph TB
    subgraph "Load Balancer Layer"
        LB[Load Balancer<br/>Round Robin<br/>Health Checks]
    end

    subgraph "Application Layer - Horizontal Scale"
        subgraph "Frontend Tier"
            F1[Frontend Pod 1]
            F2[Frontend Pod 2]
            F3[Frontend Pod N]
        end

        subgraph "API Tier"
            A1[API Gateway 1]
            A2[API Gateway 2]
            A3[API Gateway N]
        end

        subgraph "Service Tier"
            S1[AI Service 1-3]
            S2[Integration Service 1-3]
            S3[Workflow Service 1-3]
        end
    end

    subgraph "Data Layer - Vertical Scale"
        PG[(PostgreSQL<br/>Primary + 2 Replicas)]
        RedisCluster[(Redis Cluster<br/>3 Masters + 3 Slaves)]
        MQCluster[RabbitMQ Cluster<br/>3 Nodes]
    end

    subgraph "Caching Layer"
        CDN[CDN<br/>CloudFlare/AWS]
        RedisCache[(Redis Cache)]
    end

    LB --> F1 & F2 & F3
    F1 & F2 & F3 --> A1 & A2 & A3
    A1 & A2 & A3 --> S1 & S2 & S3
    S1 & S2 & S3 --> PG
    S1 & S2 & S3 --> RedisCluster
    S1 & S2 & S3 --> MQCluster

    CDN -.->. F1 & F2 & F3
    RedisCache -.->. A1 & A2 & A3

    style LB fill:#ff6b6b
    style CDN fill:#4ecdc4
    style RedisCache fill:#4ecdc4
```

## Auto-scaling Configuration

### Kubernetes Horizontal Pod Autoscaler (HPA)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: jobsprint
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

### Cluster Autoscaler

```yaml
# AWS EKS Cluster Autoscaler
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler
  namespace: kube-system
data:
  cluster-autoscaler.yaml: |
    balanceSimilarNodeGroups: true
    expander: least-waste
    maxNodeProvisionTime: 15m
    maxNodesTotal: 50
    newPodScaleUpDelay: 0s
    okTotalUnreadyPercentage: 45
    podCountThreshold: 5
    scaleDownFromGpuNode: true
    scaleDownUnneededTime: 10m
    scaleDownUnreadyTime: 20m
    scaleDownUtilizationThreshold: 0.5
    skipNodesWithLocalStorage: false
    skipNodesWithSystemPods: true
```

## Database Scalability

### PostgreSQL Scaling Strategy

#### Read Replicas
```sql
-- Primary database handles writes
-- Replicas handle read queries

-- Application logic to route queries
function query(sql) {
  if (sql.match(/SELECT/i)) {
    return executeOnReplica(sql);  // Read from replica
  } else {
    return executeOnPrimary(sql);  // Write to primary
  }
}

// Connection pool configuration
const poolConfig = {
  primary: {
    host: process.env.DB_PRIMARY_HOST,
    max: 20,
    min: 5
  },
  replicas: [
    { host: process.env.DB_REPLICA1_HOST, max: 30, min: 10 },
    { host: process.env.DB_REPLICA2_HOST, max: 30, min: 10 }
  ]
};
```

#### Connection Pooling
```javascript
// Using PgBouncer for connection pooling
const pgbouncer = require('pgbouncer');

const pool = new pgbouncer.Pool({
  host: 'pgbouncer',
  port: 6432,
  database: 'jobsprint',
  max: 100,  // Total connections to PostgreSQL
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Pool configuration
// - Default pool size: 20 connections per instance
// - Max pool size: 100 connections with PgBouncer
// - Connection lifetime: 1 hour
```

#### Partitioning Strategy
```sql
-- Partition audit logs by month
CREATE TABLE audit_logs (
  id UUID,
  created_at TIMESTAMPTZ,
  -- other fields
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automatic partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  partition_date text;
  start_date text;
  end_date text;
BEGIN
  partition_date := to_char(CURRENT_DATE + INTERVAL '1 month', 'YYYY_MM');
  start_date := to_char(CURRENT_DATE + INTERVAL '1 month', 'YYYY-MM-01');
  end_date := to_char(CURRENT_DATE + INTERVAL '2 months', 'YYYY-MM-01');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS audit_logs_%s PARTITION OF audit_logs
     FOR VALUES FROM (%L) TO (%L)',
    partition_date, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

## Cache Scalability

### Redis Cluster Configuration

```yaml
# k8s/redis/cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis-cluster
  replicas: 6  # 3 masters, 3 slaves
  template:
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command:
        - redis-server
        - /conf/redis.conf
        - --cluster-enabled yes
        - --cluster-config-file nodes.conf
        - --cluster-node-timeout 5000
        - --appendonly yes
        ports:
        - containerPort: 6379
          name: client
        - containerPort: 16379
          name: cluster
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 8Gi
        volumeMounts:
        - name: conf
          mountPath: /conf
          readOnly: false
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 20Gi
```

### Multi-Level Caching Strategy

```javascript
// Cache hierarchy
const cache = {
  // Level 1: In-memory cache (fastest, smallest)
  l1: new NodeCache({
    stdTTL: 60,  // 1 minute
    checkperiod: 120,
    useClones: false
  }),

  // Level 2: Redis cache (fast, large)
  l2: {
    async get(key) {
      return await redis.get(key);
    },
    async set(key, value, ttl) {
      return await redis.setex(key, ttl, value);
    }
  },

  // Level 3: CDN cache (slowest, unlimited)
  l3: {
    async invalidate(url) {
      await cloudflare.purgeCache([url]);
    }
  },

  async get(key) {
    // Try L1 first
    let value = this.l1.get(key);
    if (value) return value;

    // Try L2
    value = await this.l2.get(key);
    if (value) {
      this.l1.set(key, value);  // Promote to L1
      return value;
    }

    // Cache miss - load from source
    return null;
  },

  async set(key, value, ttl = 3600) {
    // Set all levels
    this.l1.set(key, value, Math.min(ttl, 60));
    await this.l2.set(key, value, ttl);
  }
};
```

## Message Queue Scalability

### RabbitMQ Cluster Configuration

```yaml
# k8s/rabbitmq/cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3.12-management-alpine
        env:
        - name: RABBITMQ_ERLANG_COOKIE
          value: "secret-cookie"
        - name: RABBITMQ_NODENAME
          value: "rabbit@$(hostname)"
        - name: RABBITMQ_CLUSTER_FORMATION
          value: "peer_discovery_k8s"
        - name: K8S_SERVICE_NAME
          value: "rabbitmq"
        - name: RABBITMQ_DEFAULT_USER
          value: "admin"
        - name: RABBITMQ_DEFAULT_PASS
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: password
        ports:
        - containerPort: 5672  # AMQP
        - containerPort: 15672 # Management UI
        - containerPort: 25672 # Cluster
```

### Queue Configuration

```javascript
// Queue policies for high throughput
const queueConfig = {
  // Workflow execution queue
  workflow: {
    durable: true,
    arguments: {
      'x-ha-policy': 'all',           // Highly available
      'x-max-length': 100000,         // Max 100k messages
      'x-message-ttl': 86400000,      // 24 hour TTL
      'x-dead-letter-exchange': 'workflow.dlx'
    }
  },

  // High priority queue
  workflow_priority: {
    durable: true,
    arguments: {
      'x-max-priority': 10
    }
  },

  // Dead letter queue
  workflow_dlx: {
    durable: true,
    arguments: {
      'x-message-ttl': 604800000      // 7 day retention
    }
  }
};
```

## Performance Optimization

### Database Query Optimization

```sql
-- Index optimization
CREATE INDEX CONCURRENTLY idx_executions_workflow_status
  ON executions(workflow_id, status)
  WHERE status IN ('running', 'pending');

CREATE INDEX CONCURRENTLY idx_audit_logs_user_timestamp
  ON audit_logs(user_id, created_at DESC);

-- Partial indexes for common queries
CREATE INDEX idx_active_workflows
  ON workflows(user_id)
  WHERE is_active = true;

-- Covering indexes
CREATE INDEX idx_workflow_stats
  ON workflows(user_id, total_executions, successful_executions)
  WHERE is_active = true;
```

### Application Performance

```javascript
// Request batching
async function batchGetWorkflows(workflowIds) {
  const batches = chunk(workflowIds, 100);  // Process 100 at a time
  const results = await Promise.all(
    batches.map(batch => Workflow.findAll({
      where: { id: { [Op.in]: batch } }
    }))
  );
  return results.flat();
}

// Parallel execution
async function executeNodes(nodes) {
  const limit = 10;  // Execute 10 nodes in parallel
  const batches = chunk(nodes, limit);

  for (const batch of batches) {
    await Promise.all(
      batch.map(node => executeNode(node))
    );
  }
}

// Stream processing
async function streamExecutions(workflowId) {
  const stream = Execution.find({ workflowId })
    .cursor()
    .mapAsync(execution => processExecution(execution));

  for await (const execution of stream) {
    await emitExecution(execution);
  }
}
```

## Capacity Planning

### Resource Requirements per User

| Metric | Per User | Scale Factor |
|--------|----------|--------------|
| Storage | 100 MB | Linear |
| Workflows | 10 | Linear |
| Executions/Month | 1000 | Linear |
| AI Tokens/Month | 100K | Linear |
| API Requests/Day | 500 | Linear |

### Infrastructure Sizing

#### Small Deployment (100 Users)
```
- Frontend: 2 pods (512Mi RAM, 0.5 CPU)
- API Gateway: 2 pods (1Gi RAM, 1 CPU)
- n8n: 2 pods (2Gi RAM, 1 CPU)
- PostgreSQL: 1 instance (4Gi RAM, 2 CPU, 100GB storage)
- Redis: 1 instance (2Gi RAM, 1 CPU, 10GB storage)
- RabbitMQ: 1 instance (2Gi RAM, 1 CPU, 10GB storage)
```

#### Medium Deployment (1,000 Users)
```
- Frontend: 3 pods (1Gi RAM, 1 CPU)
- API Gateway: 3 pods (2Gi RAM, 1 CPU)
- n8n: 3 pods (4Gi RAM, 2 CPU)
- PostgreSQL: 1 primary + 2 replicas (16Gi RAM, 4 CPU, 500GB storage)
- Redis: 3 node cluster (8Gi RAM, 2 CPU, 50GB storage)
- RabbitMQ: 3 node cluster (8Gi RAM, 2 CPU, 50GB storage)
```

#### Large Deployment (10,000+ Users)
```
- Frontend: 5+ pods with HPA (2Gi RAM, 2 CPU)
- API Gateway: 5+ pods with HPA (4Gi RAM, 2 CPU)
- n8n: 5+ pods with HPA (8Gi RAM, 4 CPU)
- PostgreSQL: 1 primary + 3 replicas (64Gi RAM, 16 CPU, 2TB storage)
- Redis: 6 node cluster (32Gi RAM, 8 CPU, 200GB storage)
- RabbitMQ: 3 node cluster (32Gi RAM, 8 CPU, 200GB storage)
```

## Monitoring Scalability

### Key Metrics

```yaml
metrics:
  # Application metrics
  - request_rate_per_second
  - request_duration_p50
  - request_duration_p95
  - request_duration_p99
  - error_rate

  # Workflow metrics
  - workflow_executions_per_minute
  - workflow_execution_duration
  - workflow_success_rate

  # Database metrics
  - database_connection_pool_usage
  - database_query_duration_p95
  - database_replication_lag

  # Cache metrics
  - cache_hit_rate
  - cache_memory_usage
  - cache_evictions_per_second

  # Queue metrics
  - queue_depth
  - queue_message_rate
  - queue_consumer_lag

  # Infrastructure metrics
  - cpu_usage_percent
  - memory_usage_percent
  - disk_usage_percent
  - network_io
```

### Auto-scaling Rules

```javascript
const scalingRules = {
  // Scale up if any metric crosses threshold
  scaleUp: {
    cpu: 80,           // CPU > 80%
    memory: 85,        // Memory > 85%
    requestRate: 1000, // > 1000 req/s per pod
    queueDepth: 10000  // Queue depth > 10k
  },

  // Scale down if all metrics below threshold
  scaleDown: {
    cpu: 30,           // CPU < 30%
    memory: 40,        // Memory < 40%
    requestRate: 200,  // < 200 req/s per pod
    stableTime: 300    // Must be stable for 5 minutes
  }
};
```

## Next Architecture Documents
- [Architecture Decision Records](./10-adrs.md)
- [Service Interfaces](./11-service-interfaces.md)
- [API Reference](./12-api-reference.md)
