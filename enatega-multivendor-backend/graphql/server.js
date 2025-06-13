// GraphQL Server Setup for CigarUnderground Backend
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { PubSub } from 'graphql-subscriptions'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'

// Import GraphQL schema and resolvers
import typeDefs from './schema/index.js'
import resolvers from './resolvers/index.js'

/**
 * Create Redis PubSub instance for GraphQL subscriptions
 * @returns {PubSub|RedisPubSub} PubSub instance
 */
export const createPubSub = () => {
  try {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      console.log('🔗 Connecting to Redis for GraphQL subscriptions...')
      const redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null
      })
      
      return new RedisPubSub({
        publisher: redis,
        subscriber: redis.duplicate()
      })
    }
  } catch (error) {
    console.warn('⚠️ Redis connection failed, falling back to in-memory PubSub:', error.message)
  }
  
  // Fallback to in-memory PubSub
  return new PubSub()
}

/**
 * Create GraphQL schema
 * @returns {GraphQLSchema} Executable GraphQL schema
 */
export const createSchema = () => {
  return makeExecutableSchema({
    typeDefs,
    resolvers
  })
}

/**
 * Create Apollo GraphQL Server
 * @param {Object} httpServer - HTTP server instance
 * @param {Object} options - Server options
 * @returns {Promise<ApolloServer>} Apollo Server instance
 */
export const createApolloServer = async (httpServer, options = {}) => {
  const {
    introspection = process.env.GRAPHQL_INTROSPECTION === 'true',
    playground = process.env.GRAPHQL_PLAYGROUND === 'true'
  } = options

  // Create GraphQL schema
  const schema = createSchema()
  
  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  })

  // Setup GraphQL WebSocket server
  const serverCleanup = useServer({ schema }, wsServer)

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    introspection,
    plugins: [
      // Proper shutdown for HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      
      // Proper shutdown for WebSocket server
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
    formatError: (error) => {
      console.error('GraphQL Error:', error)
      return {
        message: error.message,
        code: error.extensions?.code,
        path: error.path
      }
    }
  })

  await server.start()
  
  console.log('✅ GraphQL server initialized')
  console.log(`🔍 GraphQL introspection: ${introspection ? 'enabled' : 'disabled'}`)
  console.log(`🎮 GraphQL playground: ${playground ? 'enabled' : 'disabled'}`)
  
  return server
}

/**
 * Setup GraphQL middleware for Express
 * @param {Object} app - Express app instance
 * @param {Object} server - Apollo Server instance
 * @param {string} path - GraphQL endpoint path
 */
export const setupGraphQLMiddleware = (app, server, path = '/graphql') => {
  app.use(
    path,
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        // Add authentication context here if needed
        return {
          req,
          res,
          user: req.user || null
        }
      }
    })
  )
  
  console.log(`🚀 GraphQL endpoint available at ${path}`)
}