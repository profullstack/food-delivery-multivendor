const express = require('express')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')
const http = require('http')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
// const { graphqlUploadExpress } = require('graphql-upload')
require('dotenv').config()

// Import GraphQL schema and resolvers
const ageVerificationSchema = require('./graphql/schema/ageVerification')
const ageVerificationResolvers = require('./graphql/resolvers/ageVerification')

// Import middleware
const { ageVerificationMiddleware } = require('./middleware/ageVerification')

// Import helpers
const { pubsub } = require('./helpers/pubsub')

// Import models to ensure they're registered
require('./models/user')
require('./models/food')
require('./models/ageVerification')

const app = express()

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

// GraphQL file upload middleware (disabled for now)
// app.use('/graphql', graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }))

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Age verification status endpoint (REST API for quick checks)
app.get('/api/age-verification/:userId', async (req, res) => {
  try {
    const { getUserVerificationSummary } = require('./middleware/ageVerification')
    const summary = await getUserVerificationSummary(req.params.userId)
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

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

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/enatega-multivendor'
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    })
    
    console.log('✅ MongoDB connected successfully')
    
    // Set up database event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected')
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

// Start server
const startServer = async () => {
  try {
    // Connect to database
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
    
    // Start HTTP server
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server ready at http://${HOST}:${PORT}`)
      console.log(`📊 GraphQL endpoint: http://${HOST}:${PORT}/graphql`)
      console.log(`🔄 GraphQL subscriptions: ws://${HOST}:${PORT}/graphql`)
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health`)
      console.log(`🔞 Age verification API: http://${HOST}:${PORT}/api/age-verification/:userId`)
    })
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`)
      
      try {
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
          const { cleanup } = require('./helpers/pubsub')
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
      gracefulShutdown('UNCAUGHT_EXCEPTION')
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
      gracefulShutdown('UNHANDLED_REJECTION')
    })
    
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

module.exports = app