# Getting Started with Jobsprint

Welcome to Jobsprint! This guide will help you get up and running with AI-powered workflow automation in minutes.

## What is Jobsprint?

Jobsprint is a comprehensive AI-powered automation platform that combines:

- **Puter.js**: Serverless cloud & AI capabilities in frontend JavaScript
- **Zapier MCP**: 30,000+ pre-authenticated workflow actions
- **n8n**: Self-hosted workflow automation engine
- **Free AI Models**: GPT-3.5-turbo, Code-Davinci, Text-Davinci
- **Beautiful TUI**: Gum-based terminal interface

## Prerequisites

Before you begin, ensure you have:

- **Linux System**: Ubuntu 20.04+, Debian 11+, or compatible distribution
- **System Requirements**:
  - 2GB RAM minimum (4GB recommended)
  - 10GB disk space
  - Docker and Docker Compose installed
- **Basic Knowledge**: Familiarity with command-line interface
- **Ports Available**: 80, 443, 5678, 5432, 6379, 5672

## Installation

### Quick Install (Automated)

The easiest way to get started is with our automated setup script:

```bash
# Download and run the installer
curl -fsSL https://get.jobsprint.io/install.sh | bash

# Follow the interactive TUI prompts
# The script will:
# - Detect your Linux distribution
# - Install all dependencies
# - Configure Docker services
# - Setup security and SSL
# - Initialize the database
# - Create admin user
```

### Manual Install

If you prefer manual installation:

#### 1. Clone the Repository

```bash
git clone https://github.com/jobsprint/jobsprint.git
cd jobsprint
```

#### 2. Install Dependencies

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose curl gum nginx

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 3. Configure Environment

```bash
# Copy environment template
cp config/env/.env.example config/env/.env

# Edit configuration
nano config/env/.env
```

Required environment variables:

```bash
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=jobsprint
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=jobsprint

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Application
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# n8n
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
```

#### 4. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check service status
docker-compose ps
```

#### 5. Initialize Database

```bash
# Run database migrations
docker-compose exec backend npm run db:migrate

# Seed initial data
docker-compose exec backend npm run db:seed
```

#### 6. Create Admin User

```bash
# Create admin account
docker-compose exec backend npm run user:create \
  --email=admin@example.com \
  --password=SecurePassword123 \
  --role=admin
```

## First Steps

### 1. Access the Web Interface

Open your browser and navigate to:

```
http://localhost:5678
```

Login with your admin credentials.

### 2. Explore the Dashboard

The dashboard provides an overview of:

- **Workflows**: Active, inactive, and draft workflows
- **Executions**: Recent workflow executions
- **Integrations**: Connected third-party services
- **AI Usage**: Token consumption and costs

### 3. Create Your First Workflow

Let's create a simple workflow that sends a Slack message when an email is received.

#### Step 1: Create Workflow

1. Click "Create Workflow" in the dashboard
2. Name it "Email to Slack"
3. Add description: "Send Slack notification when email received"

#### Step 2: Add Trigger

1. Drag "Email Trigger" node to canvas
2. Configure:
   - Event type: "Email Received"
   - Filter: Subject contains "urgent"

#### Step 3: Add AI Node

1. Drag "AI Text" node to canvas
2. Configure:
   - Model: gpt-3.5-turbo-free
   - Prompt: "Summarize this email: {{email.body}}"

#### Step 4: Add Action

1. Drag "Slack" node to canvas
2. Configure:
   - Action: "Send Message"
   - Channel: "#alerts"
   - Message: "{{ai.output}}"

#### Step 5: Connect and Test

1. Connect nodes: Email → AI → Slack
2. Click "Test Workflow"
3. Verify the flow works correctly

#### Step 6: Activate

1. Click "Activate" button
2. Workflow is now live!

### 4. Connect Integrations

#### Zapier MCP Integration

1. Navigate to Integrations → Zapier
2. Click "Connect New App"
3. Search for "Slack"
4. Click "Connect"
5. Authorize with Zapier
6. Grant necessary permissions

#### Custom Webhook Integration

1. Navigate to Integrations → Webhooks
2. Click "Add Webhook"
3. Configure:
   - Name: "My Custom Handler"
   - URL: https://your-app.com/webhook
   - Events: workflow.executed, workflow.failed
   - Secret: generate-secure-secret
4. Click "Save"

### 5. Use the CLI

Jobsprint includes a beautiful TUI for system management:

```bash
# Start all services
sudo puter-startup

# Check system status
sudo puter-status

# View logs
sudo puter-logs

# Stop services
sudo puter-shutdown
```

## Common Tasks

### Execute a Workflow Manually

```bash
# Using CLI
docker-compose exec backend npm run workflow:execute \
  --id=wf_abc123 \
  --data='{"email":"test@example.com"}'

# Using API
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputData":{"email":"test@example.com"}}' \
  http://localhost:5678/api/v1/workflows/wf_abc123/execute
```

### View Execution History

```bash
# Using CLI
docker-compose exec backend npm run executions:list

# Using API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5678/api/v1/executions
```

### Monitor AI Usage

```bash
# Check token consumption
docker-compose exec backend npm run ai:usage

# View detailed metrics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5678/api/v1/ai/usage
```

## Next Steps

Now that you're set up, explore these resources:

1. **Workflow Guide**: Learn to build complex workflows
2. **Integration Guide**: Connect your favorite apps
3. **AI Guide**: Master AI-powered automation
4. **API Reference**: Build custom integrations
5. **Deployment Guide**: Deploy to production

## Troubleshooting

### Services Won't Start

```bash
# Check Docker logs
docker-compose logs

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up -d --build
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### AI Model Errors

```bash
# Verify Puter.js connection
docker-compose logs backend | grep puter

# Check AI service status
docker-compose exec backend npm run ai:status

# Regenerate API credentials
nano config/env/.env
# Update PUTER_API_* variables
```

### Performance Issues

```bash
# Check resource usage
docker stats

# View system metrics
sudo puter-status

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

## Getting Help

If you run into issues:

- **Documentation**: https://docs.jobsprint.io
- **GitHub Issues**: https://github.com/jobsprint/jobsprint/issues
- **Community Discord**: https://discord.gg/jobsprint
- **Email Support**: support@jobsprint.io

## What's Next?

Congratulations! You've successfully set up Jobsprint. Here are some things you can do:

1. **Explore Templates**: Check out our workflow templates gallery
2. **Build Custom Nodes**: Create custom n8n nodes for your needs
3. **Set Up Monitoring**: Configure alerts and notifications
4. **Deploy to Production**: Follow our production deployment guide
5. **Join the Community**: Share your workflows and learn from others

Happy automating!
