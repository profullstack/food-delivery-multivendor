import express from 'express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import http from 'http'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

// Configure environment variables
dotenv.config()

// Import GraphQL schema and resolvers
import ageVerificationSchema from './graphql/schema/ageVerification.js'
import ageVerificationResolvers from './graphql/resolvers/ageVerification.js'

// Import middleware
import { ageVerificationMiddleware } from './middleware/ageVerification.js'

// Import helpers
import { pubsub } from './helpers/pubsub.js'

// Import models to ensure they're registered
import './models/user.js'
import './models/food.js'
import './models/ageVerification.js'

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

  // Return 503 if critical services are not ready
  if (!appState.dbConnected || !appState.isReady) {
    return res.status(503).json({
      ...healthStatus,
      status: 'SERVICE_UNAVAILABLE',
      message: 'Service is starting up or database is not connected'
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
    const { getUserVerificationSummary } = await import('./middleware/ageVerification.js')
    const summary = await getUserVerificationSummary(req.params.userId)
    res.json(summary)
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

// Authentication middleware (placeholder - implement based on your auth system)
const getUser = async (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return null

    // TODO: Implement JWT token verification
    // const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // const user = await User.findById(decoded.userId)
    // return user

    // For now, return null (no authentication)
    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// GraphQL type definitions (combine all schemas)
const typeDefs = `
  scalar Upload
  scalar Date

  type User {
    _id: ID!
    name: String!
    email: String!
    phone: String
    avatar: String
    createdAt: Date!
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }

  ${ageVerificationSchema}
`

// GraphQL resolvers (combine all resolvers)
const resolvers = {
  ...ageVerificationResolvers,
  // Add other resolvers here as they're created
}

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

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
        bufferCommands: false,
        bufferMaxEntries: 0
      })
      
      appState.dbConnected = true
      console.log('✅ MongoDB connected successfully')
      
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
        throw error
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
    
    // Connect to database with retry logic
    await connectDB()
    
    const PORT = process.env.PORT || 4000
    const HOST = process.env.HOST || '0.0.0.0'
    
    // Create HTTP server
    const httpServer = http.createServer(app)
    
    // Create WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql'
    })
    
    // Set up WebSocket server for GraphQL subscriptions
    const serverCleanup = useServer({
      schema,
      context: async (ctx, msg, args) => {
        try {
          // TODO: Implement WebSocket authentication
          // const token = ctx.connectionParams?.authorization?.replace('Bearer ', '')
          // if (token) {
          //   const decoded = jwt.verify(token, process.env.JWT_SECRET)
          //   const user = await User.findById(decoded.userId)
          //   return { user, pubsub }
          // }
          return { pubsub }
        } catch (error) {
          console.error('WebSocket authentication error:', error)
          throw new Error('Authentication failed')
        }
      }
    }, wsServer)
    
    // Create Apollo Server
    const server = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose()
              }
            }
          }
        }
      ],
      introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
      csrfPrevention: false, // Disable CSRF protection for easier API access
      formatError: (error) => {
        console.error('GraphQL Error:', error)
        
        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production') {
          if (error.message.includes('Database') || error.message.includes('Internal')) {
            return new Error('Internal server error')
          }
        }
        
        return error
      }
    })
    
    // Start Apollo Server
    await server.start()
    appState.serverStarted = true
    
    // Apply Apollo GraphQL middleware
    app.use('/graphql',
      cors(corsOptions),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const user = await getUser(req)
          return {
            req,
            user,
            pubsub
          }
        }
      })
    )
    
    // Mark application as ready
    appState.isReady = true
    
    // Start HTTP server
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server ready at http://${HOST}:${PORT}`)
      console.log(`📊 GraphQL endpoint: http://${HOST}:${PORT}/graphql`)
      console.log(`🔄 GraphQL subscriptions: ws://${HOST}:${PORT}/graphql`)
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health`)
      console.log(`🔍 Detailed health: http://${HOST}:${PORT}/health/detailed`)
      console.log(`🔞 Age verification API: http://${HOST}:${PORT}/api/age-verification/:userId`)
    })
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`)
      
      try {
        appState.isReady = false
        
        // Stop Apollo Server
        await server.stop()
        console.log('🛑 Apollo Server stopped')
        
        // Close WebSocket server
        await serverCleanup.dispose()
        console.log('🔌 WebSocket server closed')
        
        // Stop accepting new connections
        httpServer.close(async () => {
          console.log('🔌 HTTP server closed')
          
          // Close database connection
          await mongoose.connection.close()
          console.log('🗄️ Database connection closed')
          
          // Close PubSub connections
          const { cleanup } = await import('./helpers/pubsub.js')
          await cleanup()
          
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