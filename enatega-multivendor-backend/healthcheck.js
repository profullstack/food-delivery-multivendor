// healthcheck.js - Docker health check script
import http from 'http'
import { promisify } from 'util'

/**
 * Health check configuration
 */
const config = {
  hostname: 'localhost',
  port: parseInt(process.env.PORT) || 4000,
  path: '/health',
  method: 'GET',
  timeout: 5000,
  maxRetries: 3,
  retryDelay: 1000
}

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Perform HTTP health check request
 * @returns {Promise<boolean>} - True if healthy, false otherwise
 */
const performHealthCheck = async () => {
  return new Promise((resolve) => {
    const options = {
      hostname: config.hostname,
      port: config.port,
      path: config.path,
      method: config.method,
      timeout: config.timeout
    }

    const request = http.request(options, (response) => {
      let data = ''
      
      response.on('data', (chunk) => {
        data += chunk
      })
      
      response.on('end', () => {
        try {
          if (response.statusCode === 200) {
            const healthData = JSON.parse(data)
            if (healthData.status === 'OK') {
              console.log(`✅ Health check passed: ${JSON.stringify(healthData)}`)
              resolve(true)
            } else {
              console.error(`❌ Health check failed: Invalid status - ${healthData.status}`)
              resolve(false)
            }
          } else {
            console.error(`❌ Health check failed: HTTP ${response.statusCode}`)
            resolve(false)
          }
        } catch (error) {
          console.error(`❌ Health check failed: Invalid JSON response - ${error.message}`)
          resolve(false)
        }
      })
    })

    request.on('error', (error) => {
      console.error(`❌ Health check failed: Request error - ${error.message}`)
      resolve(false)
    })

    request.on('timeout', () => {
      console.error(`❌ Health check failed: Request timeout after ${config.timeout}ms`)
      request.destroy()
      resolve(false)
    })

    request.setTimeout(config.timeout)
    request.end()
  })
}

/**
 * Main health check function with retry logic
 */
const runHealthCheck = async () => {
  console.log(`🏥 Starting health check for ${config.hostname}:${config.port}${config.path}`)
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    console.log(`🔄 Health check attempt ${attempt}/${config.maxRetries}`)
    
    try {
      const isHealthy = await performHealthCheck()
      
      if (isHealthy) {
        console.log(`✅ Health check successful on attempt ${attempt}`)
        process.exit(0)
      }
      
      if (attempt < config.maxRetries) {
        console.log(`⏳ Waiting ${config.retryDelay}ms before retry...`)
        await sleep(config.retryDelay)
      }
    } catch (error) {
      console.error(`❌ Health check attempt ${attempt} failed: ${error.message}`)
      
      if (attempt < config.maxRetries) {
        console.log(`⏳ Waiting ${config.retryDelay}ms before retry...`)
        await sleep(config.retryDelay)
      }
    }
  }
  
  console.error(`❌ Health check failed after ${config.maxRetries} attempts`)
  process.exit(1)
}

/**
 * Handle process signals gracefully
 */
const handleSignal = (signal) => {
  console.log(`📴 Received ${signal}, exiting health check...`)
  process.exit(1)
}

process.on('SIGTERM', () => handleSignal('SIGTERM'))
process.on('SIGINT', () => handleSignal('SIGINT'))

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error(`❌ Uncaught exception in health check: ${error.message}`)
  console.error(error.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(`❌ Unhandled rejection in health check:`, reason)
  process.exit(1)
})

// Run the health check
runHealthCheck().catch((error) => {
  console.error(`❌ Health check failed with error: ${error.message}`)
  process.exit(1)
})