#!/bin/bash
# Docker Management Script for Jobsprint
# Provides easy commands for managing Docker services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILES="-f docker-compose.yml"
ENVIRONMENT=${ENVIRONMENT:-development}

# Set compose files based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.prod.yml"
elif [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.dev.yml"
fi

# Functions
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║       Jobsprint Docker Manager v1.0          ║"
    echo "║      Environment: $ENVIRONMENT                 ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_menu() {
    echo -e "${GREEN}Available Commands:${NC}"
    echo "  start       - Start all services"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  status      - Show service status"
    echo "  logs        - View logs for all services"
    echo "  logs [svc]  - View logs for specific service"
    echo "  health      - Run health checks"
    echo "  build       - Rebuild all images"
    echo "  pull        - Pull latest images"
    echo "  clean       - Remove stopped containers and unused images"
    echo "  deep-clean  - Remove everything including volumes"
    echo "  backup      - Backup all data"
    echo "  restore     - Restore from backup"
    echo "  shell [svc] - Open shell in service container"
    echo "  exec [svc]  - Execute command in service"
    echo "  stats       - Show resource usage"
    echo "  ps          - Show running containers"
    echo "  help        - Show this help message"
}

start_services() {
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose $COMPOSE_FILES up -d
    echo -e "${GREEN}✓ Services started${NC}"
    ./scripts/wait-for-services.sh
}

stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose $COMPOSE_FILES down
    echo -e "${GREEN}✓ Services stopped${NC}"
}

restart_services() {
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose $COMPOSE_FILES restart
    echo -e "${GREEN}✓ Services restarted${NC}"
}

show_status() {
    echo -e "${BLUE}=== Service Status ===${NC}\n"
    docker-compose $COMPOSE_FILES ps
}

show_logs() {
    if [ -z "$1" ]; then
        echo -e "${BLUE}=== Logs for All Services ===${NC}\n"
        docker-compose $COMPOSE_FILES logs -f --tail=100
    else
        echo -e "${BLUE}=== Logs for $1 ===${NC}\n"
        docker-compose $COMPOSE_FILES logs -f --tail=100 "$1"
    fi
}

health_check() {
    echo -e "${BLUE}=== Health Check ===${NC}\n"
    ./scripts/health-check.sh
}

build_images() {
    echo -e "${YELLOW}Building images...${NC}"
    docker-compose $COMPOSE_FILES build --no-cache
    echo -e "${GREEN}✓ Images built${NC}"
}

pull_images() {
    echo -e "${YELLOW}Pulling latest images...${NC}"
    docker-compose $COMPOSE_FILES pull
    echo -e "${GREEN}✓ Images pulled${NC}"
}

clean_up() {
    echo -e "${YELLOW}Cleaning up...${NC}"
    docker container prune -f
    docker image prune -f
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

deep_clean() {
    echo -e "${RED}WARNING: This will remove all containers, images, volumes, and data!${NC}"
    read -p "Are you sure? (yes/no) " -n 3 -r
    echo
    if [[ $REPLY =~ ^yes$ ]]; then
        echo -e "${YELLOW}Deep cleaning...${NC}"
        docker-compose $COMPOSE_FILES down -v
        docker system prune -af --volumes
        echo -e "${GREEN}✓ Deep clean complete${NC}"
    else
        echo -e "${YELLOW}Cancelled${NC}"
    fi
}

backup_data() {
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    echo -e "${YELLOW}Creating backup...${NC}"

    # PostgreSQL
    echo "Backing up PostgreSQL..."
    docker-compose $COMPOSE_FILES exec -T postgres pg_dump -U jobsprint jobsprint > "$BACKUP_DIR/postgres.sql"

    # Redis
    echo "Backing up Redis..."
    docker-compose $COMPOSE_FILES exec redis redis-cli SAVE
    docker cp jobsprint-redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb"

    # RabbitMQ
    echo "Backing up RabbitMQ..."
    docker-compose $COMPOSE_FILES exec rabbitmq rabbitmqctl export_definitions > "$BACKUP_DIR/rabbitmq.json"

    # n8n
    echo "Backing up n8n..."
    docker cp jobsprint-n8n:/home/node/.n8n "$BACKUP_DIR/n8n"

    echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"
}

restore_data() {
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: restore <backup_directory>${NC}"
        exit 1
    fi

    BACKUP_DIR=$1

    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}Backup directory not found: $BACKUP_DIR${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Restoring from $BACKUP_DIR...${NC}"
    echo -e "${RED}WARNING: This will overwrite existing data!${NC}"
    read -p "Continue? (yes/no) " -n 3 -r
    echo

    if [[ $REPLY =~ ^yes$ ]]; then
        # PostgreSQL
        if [ -f "$BACKUP_DIR/postgres.sql" ]; then
            echo "Restoring PostgreSQL..."
            docker-compose $COMPOSE_FILES exec -T postgres psql -U jobsprint jobsprint < "$BACKUP_DIR/postgres.sql"
        fi

        # Redis
        if [ -f "$BACKUP_DIR/redis.rdb" ]; then
            echo "Restoring Redis..."
            docker-compose $COMPOSE_FILES stop redis
            docker cp "$BACKUP_DIR/redis.rdb" jobsprint-redis:/data/dump.rdb
            docker-compose $COMPOSE_FILES start redis
        fi

        # RabbitMQ
        if [ -f "$BACKUP_DIR/rabbitmq.json" ]; then
            echo "Restoring RabbitMQ..."
            docker-compose $COMPOSE_FILES exec rabbitmq rabbitmqctl import_definitions < "$BACKUP_DIR/rabbitmq.json"
        fi

        # n8n
        if [ -d "$BACKUP_DIR/n8n" ]; then
            echo "Restoring n8n..."
            docker cp "$BACKUP_DIR/n8n/." jobsprint-n8n:/home/node/.n8n/
        fi

        echo -e "${GREEN}✓ Restore complete${NC}"
    else
        echo -e "${YELLOW}Cancelled${NC}"
    fi
}

open_shell() {
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: shell <service>${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Opening shell in $1...${NC}"
    docker-compose $COMPOSE_FILES exec "$1" sh
}

exec_command() {
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: exec <service> <command>${NC}"
        exit 1
    fi

    SERVICE=$1
    shift
    COMMAND=$@

    echo -e "${YELLOW}Executing '$COMMAND' in $SERVICE...${NC}"
    docker-compose $COMPOSE_FILES exec "$SERVICE" $COMMAND
}

show_stats() {
    echo -e "${BLUE}=== Resource Usage ===${NC}\n"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

show_containers() {
    echo -e "${BLUE}=== Running Containers ===${NC}\n"
    docker ps --filter "name=jobsprint" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
}

# Main script
show_banner

if [ $# -eq 0 ]; then
    show_menu
    exit 0
fi

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        shift
        show_logs "$@"
        ;;
    health)
        health_check
        ;;
    build)
        build_images
        ;;
    pull)
        pull_images
        ;;
    clean)
        clean_up
        ;;
    deep-clean)
        deep_clean
        ;;
    backup)
        backup_data
        ;;
    restore)
        shift
        restore_data "$@"
        ;;
    shell)
        shift
        open_shell "$@"
        ;;
    exec)
        shift
        exec_command "$@"
        ;;
    stats)
        show_stats
        ;;
    ps)
        show_containers
        ;;
    help|--help|-h)
        show_menu
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_menu
        exit 1
        ;;
esac
