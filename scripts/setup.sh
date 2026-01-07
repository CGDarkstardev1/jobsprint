#!/bin/bash

# Jobsprint Setup Script
# This script initializes the Jobsprint development environment

set -e

echo "🚀 Setting up Jobsprint AI Automation Platform..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met!${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp config/env/.env.example .env
    echo -e "${GREEN}✅ .env file created. Please update it with your configuration.${NC}"
    echo ""
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
    echo ""
fi

# Install Node dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p tmp/uploads
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/rabbitmq
mkdir -p data/n8n
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Build Docker images
echo -e "${YELLOW}🐳 Building Docker images...${NC}"
docker-compose build
echo -e "${GREEN}✅ Docker images built${NC}"
echo ""

# Start Docker services
echo -e "${YELLOW}🚀 Starting Docker services...${NC}"
docker-compose up -d postgres redis rabbitmq
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose exec -T postgres psql -U jobsprint -d jobsprint -f /docker-entrypoint-initdb.d/init.sql || echo "Migration already run or will run on first start"
echo -e "${GREEN}✅ Database initialized${NC}"
echo ""

echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update .env with your configuration"
echo "  2. Start development server: npm run dev"
echo "  3. Start all services: npm run docker:up"
echo "  4. Check service status: docker-compose ps"
echo "  5. View logs: npm run docker:logs"
echo ""
echo "Happy coding! 🚀"
