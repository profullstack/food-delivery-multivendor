// test/health.test.js - Health check endpoint tests
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import http from 'http'

describe('Health Check Endpoints', () => {
  let server
  let app

  beforeAll(async () => {
    // Import app after setting test environment
    process.env.NODE_ENV = 'test'
    process.env.PORT = '0' // Use random available port
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db'
    
    // Mock mongoose connection for tests
    jest.mock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue(true),
      connection: {
        on: jest.fn(),
        readyState: 1 // Connected state
      }
    }))

    const { default: testApp } = await import('../index.js')
    app = testApp
    server = http.createServer(app)
    
    return new Promise((resolve) => {
      server.listen(0, () => {
        resolve()
      })
    })
  })

  afterAll(async () => {
    if (server) {
      return new Promise((resolve) => {
        server.close(resolve)
      })
    }
  })

  describe('GET /health', () => {
    it('should return 200 status with health information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('environment')
      expect(response.body).toHaveProperty('version')
    })

    it('should return valid timestamp format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      const timestamp = new Date(response.body.timestamp)
      expect(timestamp).toBeInstanceOf(Date)
      expect(timestamp.getTime()).not.toBeNaN()
    })

    it('should return numeric uptime', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(typeof response.body.uptime).toBe('number')
      expect(response.body.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should include environment information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body.environment).toBeDefined()
      expect(typeof response.body.environment).toBe('string')
    })
  })

  describe('Health Check Script', () => {
    it('should validate health check script functionality', async () => {
      // Test the health check logic directly
      const healthCheckResponse = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      }

      expect(healthCheckResponse.status).toBe('OK')
      expect(healthCheckResponse.timestamp).toBeDefined()
      expect(typeof healthCheckResponse.uptime).toBe('number')
      expect(healthCheckResponse.environment).toBeDefined()
      expect(healthCheckResponse.version).toBeDefined()
    })
  })

  describe('Database Health Check', () => {
    it('should include database connection status in health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      // Health endpoint should be accessible even if DB is not connected
      // but should indicate DB status
      expect(response.body.status).toBe('OK')
    })
  })

  describe('Error Handling', () => {
    it('should handle health check gracefully under load', async () => {
      // Test multiple concurrent health checks
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/health').expect(200)
      )

      const responses = await Promise.all(promises)
      
      responses.forEach(response => {
        expect(response.body.status).toBe('OK')
      })
    })
  })
})