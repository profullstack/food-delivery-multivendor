import express from 'express'
import http from 'http'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

// Configure environment variables
dotenv.config()

const app = express()

// Global application state
const appState = {
  isReady: false,
  dbConnected: false,
  serverStarted: false,
  startupErrors: []
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Root endpoint for basic connectivity testing
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'CigarUnderground Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      graphql: '/graphql',
      ageVerification: '/api/age-verification/:userId'
    }
  })
})

// Enhanced health check endpoint with database status
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: {
      connected: appState.dbConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: getMongooseReadyStateText(mongoose.connection.readyState)
    },
    application: {
      ready: appState.isReady,
      serverStarted: appState.serverStarted,
      errors: appState.startupErrors
    }
  }

  // Always return 200 for basic health check (service is running)
  // Database connection is optional for basic health
  if (!appState.isReady) {
    return res.status(503).json({
      ...healthStatus,
      status: 'SERVICE_UNAVAILABLE',
      message: 'Service is starting up'
    })
  }

  res.status(200).json(healthStatus)
})

// Detailed health check endpoint
app.get('/health/detailed', async (req, res) => {
  const detailedHealth = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: await getDatabaseHealth(),
    memory: process.memoryUsage(),
    application: {
      ready: appState.isReady,
      serverStarted: appState.serverStarted,
      errors: appState.startupErrors,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }

  const isHealthy = appState.dbConnected && appState.isReady && appState.startupErrors.length === 0

  res.status(isHealthy ? 200 : 503).json({
    ...detailedHealth,
    status: isHealthy ? 'OK' : 'SERVICE_UNAVAILABLE'
  })
})

// Age verification status endpoint (REST API for quick checks)
app.get('/api/age-verification/:userId', async (req, res) => {
  try {
    // TODO: Implement age verification logic
    res.json({
      userId: req.params.userId,
      verified: false,
      message: 'Age verification not implemented yet'
    })
  } catch (error) {
    console.error('Age verification API error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get human-readable mongoose connection state
 * @param {number} readyState - Mongoose connection ready state
 * @returns {string} Human-readable state
 */
function getMongooseReadyStateText(readyState) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  return states[readyState] || 'unknown'
}

/**
 * Get detailed database health information
 * @returns {Promise<object>} Database health details
 */
async function getDatabaseHealth() {
  try {
    const dbHealth = {
      connected: appState.dbConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: getMongooseReadyStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }

    // Test database connectivity with a simple operation
    if (appState.dbConnected) {
      try {
        await mongoose.connection.db.admin().ping()
        dbHealth.ping = 'success'
      } catch (pingError) {
        dbHealth.ping = 'failed'
        dbHealth.pingError = pingError.message
      }
    }

    return dbHealth
  } catch (error) {
    return {
      connected: false,
      error: error.message
    }
  }
}

// Database connection with retry logic
const connectDB = async (maxRetries = 5, retryDelay = 5000) => {
  let retries = 0
  
  while (retries < maxRetries) {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/enatega-multivendor'
      
      console.log(`🔄 Attempting to connect to MongoDB (attempt ${retries + 1}/${maxRetries})...`)
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      })
      
      appState.dbConnected = true
      console.log('✅ MongoDB connected successfully')
      
      // Clear startup errors once successfully connected
      appState.startupErrors = appState.startupErrors.filter(error =>
        !error.includes('MongoDB connection attempt')
      )
      
      // Set up database event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error)
        appState.dbConnected = false
        appState.startupErrors.push(`Database error: ${error.message}`)
      })
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected')
        appState.dbConnected = false
      })
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected')
        appState.dbConnected = true
      })
      
      return // Success, exit retry loop
      
    } catch (error) {
      retries++
      appState.dbConnected = false
      const errorMsg = `MongoDB connection attempt ${retries} failed: ${error.message}`
      console.error(`❌ ${errorMsg}`)
      appState.startupErrors.push(errorMsg)
      
      if (retries >= maxRetries) {
        console.error(`❌ Failed to connect to MongoDB after ${maxRetries} attempts`)
        // Don't throw error, allow server to start without DB for health checks
        return
      }
      
      console.log(`⏳ Retrying in ${retryDelay}ms...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
}

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting CigarUnderground Backend Server...')
    
    // Connect to database with retry logic (non-blocking)
    connectDB().catch(error => {
      console.error('❌ Database connection failed:', error)
      appState.startupErrors.push(`Database connection failed: ${error.message}`)
    })
    
    const PORT = process.env.PORT || 4000
    const HOST = process.env.HOST || '0.0.0.0'
    
    // Create HTTP server
    const httpServer = http.createServer(app)
    
    // Mark application as ready
    appState.isReady = true
    appState.serverStarted = true
    
    // Start HTTP server
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server ready at http://${HOST}:${PORT}`)
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health`)
      console.log(`🔍 Detailed health: http://${HOST}:${PORT}/health/detailed`)
      console.log(`🔞 Age verification API: http://${HOST}:${PORT}/api/age-verification/:userId`)
    })
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`)
      
      try {
        appState.isReady = false
        
        // Stop accepting new connections
        httpServer.close(async () => {
          console.log('🔌 HTTP server closed')
          
          // Close database connection
          if (appState.dbConnected) {
            await mongoose.connection.close()
            console.log('🗄️ Database connection closed')
          }
          
          console.log('✅ Graceful shutdown completed')
          process.exit(0)
        })
        
        // Force close after 10 seconds
        setTimeout(() => {
          console.error('❌ Forced shutdown after timeout')
          process.exit(1)
        }, 10000)
        
      } catch (error) {
        console.error('❌ Error during shutdown:', error)
        process.exit(1)
      }
    }
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error)
      appState.startupErrors.push(`Uncaught exception: ${error.message}`)
      gracefulShutdown('UNCAUGHT_EXCEPTION')
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
      appState.startupErrors.push(`Unhandled rejection: ${reason}`)
      gracefulShutdown('UNHANDLED_REJECTION')
    })
    
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    appState.startupErrors.push(`Server startup failed: ${error.message}`)
    process.exit(1)
  }
}

// Start the server
startServer()

export default app