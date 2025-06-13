// GraphQL Resolvers - Main Resolver Functions
import mongoose from 'mongoose'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language/index.js'

// Import individual resolvers
import userResolvers from './user.js'
import foodResolvers from './food.js'
import restaurantResolvers from './restaurant.js'
import orderResolvers from './order.js'
// TODO: Convert ageVerification models to ES modules first
// import ageVerificationResolvers from './ageVerification.js'
const ageVerificationResolvers = { Query: {}, Mutation: {}, Subscription: {} }

// Custom scalar types
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString()
    }
    throw new Error('Value is not an instance of Date: ' + value)
  },
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value)
    }
    throw new Error('Value is not a valid date string: ' + value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    throw new Error('Can only parse strings to dates but got a: ' + ast.kind)
  }
})

// Root resolvers
const rootResolvers = {
  // Custom scalars
  Date: DateScalar,

  // Root queries
  Query: {
    // Health check
    health: async () => {
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: {
          connected: mongoose.connection.readyState === 1,
          readyState: mongoose.connection.readyState,
          readyStateText: getMongooseReadyStateText(mongoose.connection.readyState)
        }
      }
    },

    // Placeholder queries (will be implemented by individual resolvers)
    me: () => null,
    users: () => [],
    foods: () => [],
    food: () => null,
    restaurants: () => [],
    restaurant: () => null,
    orders: () => [],
    order: () => null
  },

  // Root mutations
  Mutation: {
    // Placeholder mutations (will be implemented by individual resolvers)
    login: () => { throw new Error('Login not implemented yet') },
    register: () => { throw new Error('Register not implemented yet') },
    updateProfile: () => { throw new Error('Update profile not implemented yet') },
    verifyAge: () => { throw new Error('Age verification not implemented yet') },
    createOrder: () => { throw new Error('Create order not implemented yet') },
    updateOrderStatus: () => { throw new Error('Update order status not implemented yet') }
  },

  // Root subscriptions
  Subscription: {
    // Placeholder subscriptions (will be implemented by individual resolvers)
    orderStatusChanged: {
      subscribe: () => { throw new Error('Order status subscription not implemented yet') }
    },
    newOrder: {
      subscribe: () => { throw new Error('New order subscription not implemented yet') }
    },
    notification: {
      subscribe: () => { throw new Error('Notification subscription not implemented yet') }
    }
  }
}

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

// Merge all resolvers
const resolvers = {
  ...rootResolvers,
  Query: {
    ...rootResolvers.Query,
    ...userResolvers.Query,
    ...foodResolvers.Query,
    ...restaurantResolvers.Query,
    ...orderResolvers.Query,
    ...ageVerificationResolvers.Query
  },
  Mutation: {
    ...rootResolvers.Mutation,
    ...userResolvers.Mutation,
    ...foodResolvers.Mutation,
    ...restaurantResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...ageVerificationResolvers.Mutation
  },
  Subscription: {
    ...rootResolvers.Subscription,
    ...userResolvers.Subscription,
    ...foodResolvers.Subscription,
    ...restaurantResolvers.Subscription,
    ...orderResolvers.Subscription,
    ...ageVerificationResolvers.Subscription
  }
}

export default resolvers