#!/bin/bash

# Enatega Multi-vendor Docker Deployment Status Checker
# This script checks the health and status of all Docker services

echo "🚀 Enatega Multi-vendor Deployment Status Check"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker and Docker Compose are installed
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Check Docker daemon status
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker daemon is running${NC}"
echo ""

# Check container status
echo -e "${BLUE}🐳 Container Status:${NC}"
echo "===================="

containers=("enatega-mongo1" "enatega-mongo2" "enatega-mongo3" "enatega-redis" "enatega-backend" "enatega-nginx")

for container in "${containers[@]}"; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container"; then
        status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container" | awk '{print $2, $3, $4}')
        echo -e "${GREEN}✅ $container: $status${NC}"
    else
        echo -e "${RED}❌ $container: Not running${NC}"
    fi
done

echo ""

# Check service health
echo -e "${BLUE}🏥 Health Checks:${NC}"
echo "=================="

# MongoDB health check
echo -n "MongoDB Replica Set: "
if docker exec enatega-mongo1 mongosh --quiet --eval "rs.status().ok" 2>/dev/null | grep -q "1"; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Initializing or unhealthy${NC}"
fi

# Redis health check
echo -n "Redis: "
if docker exec enatega-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

# Backend health check
echo -n "Backend API: "
if curl -s http://localhost/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

# Nginx health check
echo -n "Nginx Proxy: "
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

echo ""

# Check network connectivity
echo -e "${BLUE}🌐 Network Connectivity:${NC}"
echo "========================"

# Test GraphQL endpoint
echo -n "GraphQL Endpoint: "
if curl -s -X POST http://localhost/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __schema { types { name } } }"}' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${RED}❌ Not accessible${NC}"
fi

# Test MongoDB connection from backend
echo -n "Backend → MongoDB: "
if docker exec enatega-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => { console.log('Connected'); process.exit(0); })
.catch(() => { console.log('Failed'); process.exit(1); });
" 2>/dev/null | grep -q "Connected"; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Connection failed${NC}"
fi

# Test Redis connection from backend
echo -n "Backend → Redis: "
if docker exec enatega-backend node -e "
const redis = require('redis');
const client = redis.createClient({url: process.env.REDIS_URL});
client.connect()
.then(() => { console.log('Connected'); client.quit(); })
.catch(() => { console.log('Failed'); });
" 2>/dev/null | grep -q "Connected"; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Connection failed${NC}"
fi

echo ""

# Resource usage
echo -e "${BLUE}📊 Resource Usage:${NC}"
echo "==================="

docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -7

echo ""

# Port status
echo -e "${BLUE}🔌 Port Status:${NC}"
echo "==============="

ports=("80:Nginx" "4000:Backend" "27017:MongoDB-1" "27018:MongoDB-2" "27019:MongoDB-3" "6379:Redis")

for port_info in "${ports[@]}"; do
    port=$(echo "$port_info" | cut -d: -f1)
    service=$(echo "$port_info" | cut -d: -f2)
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ Port $port ($service): Open${NC}"
    else
        echo -e "${RED}❌ Port $port ($service): Closed${NC}"
    fi
done

echo ""

# Volume status
echo -e "${BLUE}💾 Volume Status:${NC}"
echo "=================="

volumes=("mongo1_data" "mongo2_data" "mongo3_data" "redis_data")

for volume in "${volumes[@]}"; do
    if docker volume ls | grep -q "food-delivery-multivendor_$volume"; then
        size=$(docker system df -v | grep "food-delivery-multivendor_$volume" | awk '{print $3}' || echo "Unknown")
        echo -e "${GREEN}✅ $volume: $size${NC}"
    else
        echo -e "${RED}❌ $volume: Not found${NC}"
    fi
done

echo ""

# Log summary
echo -e "${BLUE}📝 Recent Logs Summary:${NC}"
echo "======================="

echo "Backend (last 5 lines):"
docker logs --tail 5 enatega-backend 2>/dev/null | sed 's/^/  /'

echo ""
echo "MongoDB (last 3 lines):"
docker logs --tail 3 enatega-mongo1 2>/dev/null | sed 's/^/  /'

echo ""

# Final status
echo -e "${BLUE}🎯 Overall Status:${NC}"
echo "=================="

running_containers=$(docker ps --filter "name=enatega-" --format "{{.Names}}" | wc -l)
total_containers=6

if [ "$running_containers" -eq "$total_containers" ]; then
    echo -e "${GREEN}✅ All services are running ($running_containers/$total_containers)${NC}"
    echo -e "${GREEN}🚀 Deployment is ready!${NC}"
    echo ""
    echo -e "${BLUE}📍 Access Points:${NC}"
    echo "  • GraphQL Playground: http://localhost/graphql"
    echo "  • API Health Check: http://localhost/health"
    echo "  • Backend Direct: http://localhost:4000"
else
    echo -e "${YELLOW}⚠️  Some services are not running ($running_containers/$total_containers)${NC}"
    echo -e "${YELLOW}🔧 Check the logs above for issues${NC}"
fi

echo ""
echo -e "${BLUE}💡 Useful Commands:${NC}"
echo "  • View all logs: docker compose logs -f"
echo "  • Restart services: docker compose restart"
echo "  • Stop services: docker compose down"
echo "  • Check this status: ./scripts/check-deployment.sh"