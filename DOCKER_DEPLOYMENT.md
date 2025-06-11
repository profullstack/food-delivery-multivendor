# Enatega Multi-vendor Docker Deployment Guide

This guide explains how to deploy the Enatega Multi-vendor Food Delivery Solution with Docker Compose, including the new age verification system.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB free disk space

## Quick Start

1. **Clone and prepare the environment:**
   ```bash
   git clone <repository-url>
   cd food-delivery-multivendor
   cp .env.docker .env
   ```

2. **Configure environment variables:**
   Edit `.env` file with your actual values:
   ```bash
   nano .env
   ```
   
   **Required configurations:**
   - `MONGO_PASSWORD`: Set a secure MongoDB password
   - `REDIS_PASSWORD`: Set a secure Redis password
   - `JWT_SECRET`: Generate a secure JWT secret (32+ characters)
   - `CLOUDINARY_*`: Configure Cloudinary for file uploads
   - `FIREBASE_*`: Configure Firebase for push notifications

3. **Start the services:**
   ```bash
   docker compose up -d
   ```

4. **Initialize MongoDB replica set:**
   ```bash
   # Wait for MongoDB containers to be ready (about 30 seconds)
   docker compose exec mongo1 mongosh --eval "rs.status()"
   
   # If replica set is not initialized, run:
   docker compose exec mongo1 mongosh /scripts/setup-replica-set.js
   ```

5. **Verify deployment:**
   ```bash
   # Check all services are running
   docker compose ps
   
   # Check backend health
   curl http://localhost/health
   
   # Check GraphQL endpoint
   curl -X POST http://localhost/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { types { name } } }"}'
   ```

## Architecture Overview

The Docker deployment includes:

- **Nginx**: Reverse proxy with rate limiting and SSL termination
- **Backend API**: Node.js/Express GraphQL API with age verification
- **MongoDB Replica Set**: 3-node replica set for high availability
- **Redis**: Caching and GraphQL subscriptions
- **Health Checks**: Automated health monitoring

## Service Details

### Backend API (Port 4000)
- GraphQL endpoint: `http://localhost/graphql`
- Health check: `http://localhost/health`
- Age verification endpoints included
- Real-time subscriptions via WebSocket

### MongoDB Replica Set
- Primary: `mongo1:27017`
- Secondary: `mongo2:27018`
- Secondary: `mongo3:27019`
- Automatic failover and data replication

### Redis (Port 6379)
- GraphQL subscription support
- Session storage
- Caching layer

### Nginx (Port 80)
- Reverse proxy to backend
- Rate limiting (10 req/s for API, 5 req/s for GraphQL)
- CORS headers
- Static file serving
- SSL ready (configuration included)

## Age Verification System

The deployment includes a complete age verification system:

### Features
- Document upload with Cloudinary storage
- Real-time verification status updates
- Admin review dashboard
- Automatic checkout enforcement
- Multi-language support
- GDPR compliance

### API Endpoints
- `POST /graphql` - Age verification mutations
- `GET /graphql` - Age verification queries
- WebSocket subscriptions for real-time updates

## Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Database
MONGO_URL=mongodb://mongo1:27017,mongo2:27018,mongo3:27019/enatega?replicaSet=rs0
MONGO_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_redis_password

# Authentication
JWT_SECRET=your_jwt_secret_32_chars_minimum

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Push Notifications
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
```

### Scaling Configuration

To scale services:

```bash
# Scale backend API
docker-compose up -d --scale enatega-backend=3

# Scale with load balancer update
docker-compose up -d --scale enatega-backend=3 nginx
```

## Monitoring and Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f enatega-backend
docker-compose logs -f mongo1
docker-compose logs -f redis
docker-compose logs -f nginx
```

### Health Checks
```bash
# Check service health
docker-compose ps

# Backend health endpoint
curl http://localhost/health

# MongoDB replica set status
docker-compose exec mongo1 mongosh --eval "rs.status()"

# Redis connectivity
docker-compose exec redis redis-cli ping
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Service-specific stats
docker stats enatega_enatega-backend_1
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker compose exec mongo1 mongodump --host rs0/mongo1:27017,mongo2:27018,mongo3:27019 --out /backup

# Copy backup to host
docker cp enatega-mongo1:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Database Restore
```bash
# Copy backup to container
docker cp ./mongodb-backup enatega-mongo1:/restore

# Restore database
docker compose exec mongo1 mongorestore --host rs0/mongo1:27017,mongo2:27018,mongo3:27019 /restore
```

## Troubleshooting

### Common Issues

1. **MongoDB replica set not initialized:**
   ```bash
   docker-compose exec mongo1 mongosh /scripts/setup-replica-set.js
   ```

2. **Backend can't connect to MongoDB:**
   ```bash
   # Check MongoDB status
   docker-compose logs mongo1
   
   # Verify replica set
   docker-compose exec mongo1 mongosh --eval "rs.status()"
   ```

3. **GraphQL subscriptions not working:**
   ```bash
   # Check Redis connectivity
   docker-compose exec redis redis-cli ping
   
   # Check backend logs
   docker-compose logs enatega-backend
   ```

4. **File uploads failing:**
   - Verify Cloudinary configuration in `.env`
   - Check backend logs for Cloudinary errors
   - Ensure `CLOUDINARY_FOLDER` exists

### Debug Mode

Enable debug mode:
```bash
# Add to .env
NODE_ENV=development
DEBUG=enatega:*
ENABLE_GRAPHQL_PLAYGROUND=true

# Restart services
docker-compose restart enatega-backend
```

## Security Considerations

### Production Deployment

1. **SSL/TLS Configuration:**
   - Uncomment SSL section in `nginx/nginx.conf`
   - Add SSL certificates to `nginx/ssl/`
   - Update environment variables for HTTPS

2. **Firewall Rules:**
   ```bash
   # Only allow necessary ports
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw deny 4000/tcp  # Block direct backend access
   ```

3. **Environment Security:**
   - Use strong passwords (32+ characters)
   - Rotate secrets regularly
   - Use Docker secrets for sensitive data
   - Enable MongoDB authentication

4. **Network Security:**
   - Use custom Docker networks
   - Implement IP whitelisting
   - Configure rate limiting
   - Enable audit logging

## Maintenance

### Updates
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Clean old images
docker image prune -f
```

### Database Maintenance
```bash
# Compact database
docker-compose exec mongo1 mongosh --eval "db.runCommand({compact: 'collection_name'})"

# Reindex collections
docker-compose exec mongo1 mongosh --eval "db.collection.reIndex()"
```

## Support

For issues related to:
- **Age Verification System**: Check GraphQL schema and resolvers
- **File Uploads**: Verify Cloudinary configuration
- **Real-time Features**: Check Redis and WebSocket connections
- **Database Issues**: Verify MongoDB replica set status

## Performance Tuning

### MongoDB Optimization
```javascript
// Add to MongoDB initialization
db.ageVerifications.createIndex({ userId: 1, status: 1 })
db.ageVerifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })
db.users.createIndex({ email: 1 }, { unique: true })
db.foods.createIndex({ isAgeRestricted: 1, category: 1 })
```

### Redis Optimization
```bash
# Add to redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 2048;
keepalive_requests 1000;
client_body_buffer_size 128k;
client_max_body_size 10m;