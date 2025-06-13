// test/healthcheck.test.js - Health check script tests
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { spawn } from 'child_process'
import http from 'http'
import { promisify } from 'util'

describe('Health Check Script', () => {
  let testServer
  let testPort

  beforeAll(async () => {
    // Create a test HTTP server to simulate the backend
    testServer = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: 'test',
          version: '1.0.0'
        }))
      } else {
        res.writeHead(404)
        res.end('Not Found')
      }
    })

    // Start server on random port
    return new Promise((resolve) => {
      testServer.listen(0, () => {
        testPort = testServer.address().port
        resolve()
      })
    })
  })

  afterAll(async () => {
    if (testServer) {
      return new Promise((resolve) => {
        testServer.close(resolve)
      })
    }
  })

  describe('Successful Health Check', () => {
    it('should exit with code 0 when health check passes', async () => {
      const result = await runHealthCheckScript({
        PORT: testPort.toString()
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Health check passed')
      expect(result.stdout).toContain('✅')
    }, 15000)

    it('should parse and validate health response', async () => {
      const result = await runHealthCheckScript({
        PORT: testPort.toString()
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('"status":"OK"')
      expect(result.stdout).toContain('timestamp')
      expect(result.stdout).toContain('uptime')
    }, 15000)
  })

  describe('Failed Health Check', () => {
    it('should exit with code 1 when server is not available', async () => {
      const result = await runHealthCheckScript({
        PORT: '9999' // Non-existent port
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Health check failed')
      expect(result.stderr).toContain('❌')
    }, 15000)

    it('should retry on connection failure', async () => {
      const result = await runHealthCheckScript({
        PORT: '9998' // Non-existent port
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('attempt 1/3')
      expect(result.stderr).toContain('attempt 2/3')
      expect(result.stderr).toContain('attempt 3/3')
    }, 15000)
  })

  describe('Health Check Configuration', () => {
    it('should use correct default configuration', async () => {
      const result = await runHealthCheckScript({
        PORT: testPort.toString()
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain(`localhost:${testPort}/health`)
    }, 15000)

    it('should handle custom port configuration', async () => {
      const customPort = testPort
      const result = await runHealthCheckScript({
        PORT: customPort.toString()
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain(`localhost:${customPort}/health`)
    }, 15000)
  })

  describe('Error Handling', () => {
    let faultyServer

    beforeAll(async () => {
      // Create a server that returns invalid responses
      faultyServer = http.createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end('Internal Server Error')
        } else {
          res.writeHead(404)
          res.end('Not Found')
        }
      })

      return new Promise((resolve) => {
        faultyServer.listen(0, resolve)
      })
    })

    afterAll(async () => {
      if (faultyServer) {
        return new Promise((resolve) => {
          faultyServer.close(resolve)
        })
      }
    })

    it('should handle HTTP error responses', async () => {
      const faultyPort = faultyServer.address().port
      const result = await runHealthCheckScript({
        PORT: faultyPort.toString()
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('HTTP 500')
    }, 15000)
  })

  describe('Signal Handling', () => {
    it('should handle SIGTERM gracefully', async () => {
      const child = spawn('node', ['healthcheck.js'], {
        cwd: process.cwd(),
        env: { ...process.env, PORT: '9997' }, // Non-existent port to keep it running
        stdio: ['pipe', 'pipe', 'pipe']
      })

      // Wait a bit then send SIGTERM
      setTimeout(() => {
        child.kill('SIGTERM')
      }, 1000)

      const result = await waitForProcess(child)
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('SIGTERM')
    }, 10000)
  })
})

/**
 * Run the health check script with given environment variables
 * @param {object} env - Environment variables
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>}
 */
async function runHealthCheckScript(env = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', ['healthcheck.js'], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr
      })
    })

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr + error.message
      })
    })
  })
}

/**
 * Wait for a child process to complete
 * @param {ChildProcess} child - Child process
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>}
 */
async function waitForProcess(child) {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr
      })
    })

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr + error.message
      })
    })
  })
}