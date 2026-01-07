#!/bin/bash
# Health check script for all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Jobsprint Health Check ===${NC}\n"

# Service health check functions
check_postgres() {
    echo -e "${YELLOW}Checking PostgreSQL...${NC}"
    if docker exec jobsprint-postgres pg_isready -U jobsprint > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is healthy${NC}"
        docker exec jobsprint-postgres psql -U jobsprint -d jobsprint -c "SELECT version();" > /dev/null 2>&1
        echo -e "${GREEN}✓ PostgreSQL queries working${NC}"
        return 0
    else
        echo -e "${RED}✗ PostgreSQL is not healthy${NC}"
        return 1
    fi
}

check_redis() {
    echo -e "\n${YELLOW}Checking Redis...${NC}"
    if docker exec jobsprint-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is healthy${NC}"
        local info=$(docker exec jobsprint-redis redis-cli INFO server | grep redis_version)
        echo -e "${GREEN}✓ Redis $info${NC}"
        return 0
    else
        echo -e "${RED}✗ Redis is not healthy${NC}"
        return 1
    fi
}

check_rabbitmq() {
    echo -e "\n${YELLOW}Checking RabbitMQ...${NC}"
    if docker exec jobsprint-rabbitmq rabbitmq-diagnostics -q ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ RabbitMQ is healthy${NC}"
        local queues=$(docker exec jobsprint-rabbitmq rabbitmqctl list_queues | wc -l)
        echo -e "${GREEN}✓ RabbitMQ has $((queues-1)) queues${NC}"
        return 0
    else
        echo -e "${RED}✗ RabbitMQ is not healthy${NC}"
        return 1
    fi
}

check_n8n() {
    echo -e "\n${YELLOW}Checking n8n...${NC}"
    if curl -f http://localhost:5678/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✓ n8n is healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ n8n is not healthy${NC}"
        return 1
    fi
}

check_app() {
    echo -e "\n${YELLOW}Checking Jobsprint Application...${NC}"
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is healthy${NC}"
        local response=$(curl -s http://localhost:3000/health)
        echo -e "${GREEN}✓ Health response: $response${NC}"
        return 0
    else
        echo -e "${RED}✗ Application is not healthy${NC}"
        return 1
    fi
}

check_nginx() {
    echo -e "\n${YELLOW}Checking Nginx...${NC}"
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Nginx is healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Nginx is not healthy${NC}"
        return 1
    fi
}

check_docker_containers() {
    echo -e "\n${YELLOW}Checking Docker containers status...${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=jobsprint"
}

check_resource_usage() {
    echo -e "\n${YELLOW}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" --filter "name=jobsprint"
}

# Run all checks
FAILED=0

check_postgres || FAILED=1
check_redis || FAILED=1
check_rabbitmq || FAILED=1
check_n8n || FAILED=1
check_app || FAILED=1
check_nginx || FAILED=1
check_docker_containers
check_resource_usage

echo -e "\n${BLUE}=== Health Check Complete ===${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}Some services are not healthy!${NC}"
    exit 1
fi
