#!/bin/bash
# Wait for Docker services to be healthy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Waiting for services to be healthy...${NC}"

# Maximum wait time in seconds
MAX_WAIT=300
WAIT_INTERVAL=5

check_service() {
    local service_name=$1
    local check_command=$2
    local elapsed=0

    echo -e "${YELLOW}Checking $service_name...${NC}"

    while [ $elapsed -lt $MAX_WAIT ]; do
        if eval "$check_command" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name is ready${NC}"
            return 0
        fi

        echo -e "${YELLOW}Waiting for $service_name... (${elapsed}s)${NC}"
        sleep $WAIT_INTERVAL
        elapsed=$((elapsed + WAIT_INTERVAL))
    done

    echo -e "${RED}✗ $service_name failed to start${NC}"
    return 1
}

# Check PostgreSQL
check_service "PostgreSQL" "docker exec jobsprint-postgres pg_isready -U jobsprint"

# Check Redis
check_service "Redis" "docker exec jobsprint-redis redis-cli ping"

# Check RabbitMQ
check_service "RabbitMQ" "docker exec jobsprint-rabbitmq rabbitmq-diagnostics -q ping"

# Check n8n
check_service "n8n" "curl -f http://localhost:5678/healthz"

# Check Application
check_service "Jobsprint App" "curl -f http://localhost:3000/health"

# Check Nginx
check_service "Nginx" "curl -f http://localhost/health"

echo -e "${GREEN}All services are healthy!${NC}"
