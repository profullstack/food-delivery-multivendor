# API Health Check Fix Documentation

## Problem Summary

The API service health check was failing with the following issues:

1. **Port Mismatch**: Health check script used incorrect port configuration
2. **Docker Dependencies**: Health check relied on `curl` which wasn't reliably available
3. **Timing Issues**: Insufficient startup time for database initialization
4. **Limited Retry Logic**: Basic health check without proper error handling

## Root Cause Analysis

### Original Issues

1. **healthcheck.js**: Used `process.env.PORT || 4000` but Docker health check tried `localhost:4000`
2. **docker-compose.yml**: Used `curl` command which required additional dependencies
3. **Database Startup**: MongoDB replica set initialization took longer than health check timeout
4. **Error Handling**: Limited logging and retry mechanisms

### Error Logs Analysis

```
[INFO] api not ready yet (attempt 1/10), waiting 5s...
[ERROR] api health check failed after 10 attempts
```

This indicated the API service was taking longer than expected to become ready.

## Solution Implementation

### 1. Enhanced Health Check Script

**File**: [`enatega-multivendor-backend/healthcheck.js`](enatega-multivendor-backend/healthcheck.js)

**Key Improvements**:
- ✅ Modern ES modules syntax
- ✅ Proper port configuration using `parseInt(process.env.PORT)`
- ✅ Retry logic with configurable attempts and delays
- ✅ Comprehensive error logging with emojis for visibility
- ✅ Graceful signal handling (SIGTERM, SIGINT)
- ✅ JSON response validation
- ✅ Timeout handling with proper cleanup

**Configuration**:
```javascript
const config = {
  hostname: 'localhost',
  port: parseInt(process.env.PORT) || 4000,
  path: '/health',
  method: 'GET',
  timeout: 5000,
  maxRetries: 3,
  retryDelay: 1000
}
```

### 2. Improved Backend Server

**File**: [`enatega-multivendor-backend/index.js`](enatega-multivendor-backend/index.js)

**Key Improvements**:
- ✅ Converted to ES modules (`"type": "module"` in package.json)
- ✅ Enhanced health endpoint with database status
- ✅ Application state tracking
- ✅ Database connection retry logic
- ✅ Detailed health information endpoint (`/health/detailed`)
- ✅ Better error handling and logging

**Health Response Example**:
```json
{
  "status": "OK",
  "timestamp": "2025-06-13T11:17:00.000Z",
  "uptime": 45.123,
  "environment": "production",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "readyState": 1,
    "readyStateText": "connected"
  },
  "application": {
    "ready": true,
    "serverStarted": true,
    "errors": []
  }
}
```

### 3. Docker Configuration Updates

**File**: [`docker-compose.yml`](docker-compose.yml)

**Changes**:
```yaml
healthcheck:
  test: ["CMD", "node", "healthcheck.js"]  # Changed from curl
  interval: 30s
  timeout: 10s
  retries: 5                              # Increased from 3
  start_period: 120s                      # Increased from 60s
```

**File**: [`enatega-multivendor-backend/Dockerfile`](enatega-multivendor-backend/Dockerfile)

**Changes**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD node healthcheck.js
```

### 4. MongoDB Replica Set Initialization

**File**: [`scripts/setup-replica-set.js`](scripts/setup-replica-set.js)

**Features**:
- ✅ Automatic replica set initialization
- ✅ Primary node detection and waiting
- ✅ Database and collection setup
- ✅ Comprehensive error handling
- ✅ Status monitoring and logging

### 5. Comprehensive Test Suite

**Files**: 
- [`enatega-multivendor-backend/test/health.test.js`](enatega-multivendor-backend/test/health.test.js)
- [`enatega-multivendor-backend/test/healthcheck.test.js`](enatega-multivendor-backend/test/healthcheck.test.js)

**Test Coverage**:
- ✅ Health endpoint functionality
- ✅ Health check script execution
- ✅ Error handling scenarios
- ✅ Retry logic validation
- ✅ Signal handling
- ✅ Database connectivity

## Configuration Changes

### Environment Variables

The following environment variables affect health check behavior:

```bash
# Backend Configuration
PORT=4000                    # Server port
HOST=0.0.0.0                # Server host
NODE_ENV=production          # Environment

# Database Configuration
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/cigarunderground?replicaSet=rs0

# Health Check Timing
HEALTH_CHECK_TIMEOUT=5000    # Health check timeout (ms)
HEALTH_CHECK_RETRIES=3       # Number of retries
HEALTH_CHECK_DELAY=1000      # Delay between retries (ms)
```

### Timing Parameters

| Parameter | Old Value | New Value | Reason |
|-----------|-----------|-----------|---------|
| `start_period` | 60s | 120s | More time for DB initialization |
| `retries` | 3 | 5 | More attempts for reliability |
| `timeout` | 3s | 10s | Longer timeout for slow responses |

## Testing Instructions

### 1. Run Health Check Tests

```bash
cd enatega-multivendor-backend
pnpm test test/health.test.js
pnpm test test/healthcheck.test.js
```

### 2. Manual Health Check Testing

```bash
# Test health endpoint directly
curl http://localhost:10702/health

# Test detailed health endpoint
curl http://localhost:10702/health/detailed

# Test health check script
cd enatega-multivendor-backend
node healthcheck.js
```

### 3. Docker Health Check Testing

```bash
# Check container health status
docker compose ps

# View health check logs
docker compose logs cigarunderground-backend

# Manual health check in container
docker compose exec cigarunderground-backend node healthcheck.js
```

## Monitoring and Debugging

### Health Check Logs

The improved health check provides detailed logging:

```
🏥 Starting health check for localhost:4000/health
🔄 Health check attempt 1/3
✅ Health check passed: {"status":"OK","timestamp":"..."}
```

### Error Scenarios

Common error patterns and solutions:

1. **Connection Refused**:
   ```
   ❌ Health check failed: Request error - connect ECONNREFUSED
   ```
   - **Solution**: Check if backend service is running

2. **Database Not Ready**:
   ```json
   {"status":"SERVICE_UNAVAILABLE","database":{"connected":false}}
   ```
   - **Solution**: Wait for MongoDB replica set initialization

3. **Timeout**:
   ```
   ❌ Health check failed: Request timeout after 5000ms
   ```
   - **Solution**: Check server performance and database connectivity

### Debugging Commands

```bash
# Check MongoDB replica set status
docker compose exec mongo1 mongosh --eval "rs.status()"

# View backend logs
docker compose logs -f cigarunderground-backend

# Check container resource usage
docker stats cigarunderground-backend

# Test database connectivity
docker compose exec cigarunderground-backend node -e "
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
console.log('DB connected:', mongoose.connection.readyState);
process.exit(0);
"
```

## Performance Improvements

### Startup Time Optimization

1. **Database Connection Pooling**: Configured optimal pool size
2. **Retry Logic**: Exponential backoff for database connections
3. **Health Check Caching**: Avoid redundant database queries
4. **Resource Monitoring**: Track memory and CPU usage

### Reliability Enhancements

1. **Circuit Breaker Pattern**: Fail fast on repeated failures
2. **Graceful Degradation**: Partial functionality during issues
3. **Monitoring Integration**: Structured logging for observability
4. **Auto-Recovery**: Automatic restart on critical failures

## Future Improvements

### Planned Enhancements

1. **Metrics Collection**: Prometheus/Grafana integration
2. **Advanced Health Checks**: Deep dependency validation
3. **Load Testing**: Stress testing health endpoints
4. **Alerting**: Integration with monitoring systems

### Monitoring Integration

```javascript
// Example: Prometheus metrics
import prometheus from 'prom-client';

const healthCheckDuration = new prometheus.Histogram({
  name: 'health_check_duration_seconds',
  help: 'Duration of health checks'
});

const healthCheckTotal = new prometheus.Counter({
  name: 'health_check_total',
  help: 'Total number of health checks',
  labelNames: ['status']
});
```

## Conclusion

The health check improvements address the root causes of API service failures:

1. ✅ **Reliability**: Enhanced retry logic and error handling
2. ✅ **Observability**: Comprehensive logging and status reporting
3. ✅ **Performance**: Optimized timing and resource usage
4. ✅ **Maintainability**: Modern code structure and comprehensive tests

The API service should now start reliably and provide accurate health status information for monitoring and deployment systems.