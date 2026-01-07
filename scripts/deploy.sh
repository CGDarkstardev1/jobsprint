#!/bin/bash
# Deployment script for Jobsprint

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILES="-f docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.prod.yml"
    echo -e "${BLUE}Deploying to production...${NC}"
elif [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.dev.yml"
    echo -e "${BLUE}Deploying to development...${NC}"
else
    echo -e "${RED}Invalid environment. Use 'production' or 'development'${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env.$ENVIRONMENT ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}No .env.$ENVIRONMENT file found, using defaults${NC}"
fi

# Function to backup database
backup_database() {
    echo -e "${YELLOW}Creating database backup...${NC}"
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    docker-compose $COMPOSE_FILES exec -T postgres pg_dump -U jobsprint jobsprint > "$BACKUP_DIR/jobsprint_backup.sql"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database backup created at $BACKUP_DIR${NC}"
    else
        echo -e "${RED}✗ Database backup failed${NC}"
        exit 1
    fi
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker-compose $COMPOSE_FILES exec jobsprint-app npm run migrate:up

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migrations completed${NC}"
    else
        echo -e "${RED}✗ Migrations failed${NC}"
        exit 1
    fi
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose $COMPOSE_FILES down
    docker-compose $COMPOSE_FILES up -d

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Services restarted${NC}"
    else
        echo -e "${RED}✗ Service restart failed${NC}"
        exit 1
    fi
}

# Function to health check
health_check() {
    echo -e "${YELLOW}Running health checks...${NC}"
    sleep 30  # Wait for services to start

    ./scripts/health-check.sh

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ All services healthy${NC}"
    else
        echo -e "${RED}✗ Health check failed${NC}"
        exit 1
    fi
}

# Function to rollback
rollback() {
    echo -e "${RED}Rolling back deployment...${NC}"
    docker-compose $COMPOSE_FILES down
    git checkout HEAD~1
    docker-compose $COMPOSE_FILES up -d
    echo -e "${GREEN}✓ Rollback completed${NC}"
}

# Main deployment flow
echo -e "${BLUE}=== Jobsprint Deployment ===${NC}\n"

# Ask for confirmation in production
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}WARNING: Deploying to production!${NC}"
    read -p "Are you sure? (yes/no) " -n 3 -r
    echo
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
fi

# Create backup
if [ "$ENVIRONMENT" = "production" ]; then
    backup_database
fi

# Pull latest images
echo -e "${YELLOW}Pulling latest Docker images...${NC}"
docker-compose $COMPOSE_FILES pull

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose $COMPOSE_FILES build

# Restart services
restart_services

# Run migrations
run_migrations

# Health check
health_check

# Clean up old images
echo -e "${YELLOW}Cleaning up old Docker images...${NC}"
docker image prune -af --filter "until=24h"

echo -e "\n${GREEN}=== Deployment successful! ===${NC}"
echo -e "${GREEN}Services are running at:${NC}"
echo -e "  - Application: http://localhost:3000"
echo -e "  - n8n: http://localhost:5678"
echo -e "  - RabbitMQ Management: http://localhost:15672"
