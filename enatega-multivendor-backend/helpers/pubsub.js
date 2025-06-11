const { PubSub } = require('graphql-subscriptions')
const { RedisPubSub } = require('graphql-redis-subscriptions')
const Redis = require('ioredis')

// Create PubSub instance based on environment
let pubsub

if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
  // Use Redis PubSub for production/distributed environments
  try {
    const redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true
    }

    // Parse Redis URL if provided
    if (process.env.REDIS_URL) {
      const redisUrl = new URL(process.env.REDIS_URL)
      redisOptions.host = redisUrl.hostname
      redisOptions.port = parseInt(redisUrl.port) || 6379
      if (redisUrl.password) {
        redisOptions.password = redisUrl.password
      }
    }

    pubsub = new RedisPubSub({
      publisher: new Redis(redisOptions),
      subscriber: new Redis(redisOptions),
      connectionListener: (err) => {
        if (err) {
          console.error('Redis PubSub connection error:', err)
        } else {
          console.log('Redis PubSub connected successfully')
        }
      }
    })

    console.log('Using Redis PubSub for GraphQL subscriptions')
  } catch (error) {
    console.error('Failed to initialize Redis PubSub, falling back to in-memory:', error)
    pubsub = new PubSub()
  }
} else {
  // Use in-memory PubSub for development
  pubsub = new PubSub()
  console.log('Using in-memory PubSub for GraphQL subscriptions')
}

// Subscription event constants
const SUBSCRIPTION_EVENTS = {
  // Age Verification Events
  AGE_VERIFICATION_UPDATED: 'AGE_VERIFICATION_UPDATED',
  NEW_AGE_VERIFICATION_SUBMISSION: 'NEW_AGE_VERIFICATION_SUBMISSION',
  AGE_VERIFICATION_EXPIRED: 'AGE_VERIFICATION_EXPIRED',
  
  // Order Events
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  
  // User Events
  USER_UPDATED: 'USER_UPDATED',
  USER_NOTIFICATION: 'USER_NOTIFICATION',
  
  // Admin Events
  ADMIN_NOTIFICATION: 'ADMIN_NOTIFICATION',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  
  // Chat Events
  MESSAGE_SENT: 'MESSAGE_SENT',
  TYPING_INDICATOR: 'TYPING_INDICATOR',
  
  // Restaurant Events
  RESTAURANT_STATUS_CHANGED: 'RESTAURANT_STATUS_CHANGED',
  NEW_ORDER_FOR_RESTAURANT: 'NEW_ORDER_FOR_RESTAURANT',
  
  // Rider Events
  RIDER_LOCATION_UPDATED: 'RIDER_LOCATION_UPDATED',
  NEW_ORDER_FOR_RIDER: 'NEW_ORDER_FOR_RIDER'
}

/**
 * Publish an event to subscribers
 * @param {string} eventName - Event name
 * @param {Object} payload - Event payload
 * @returns {Promise<void>}
 */
const publishEvent = async (eventName, payload) => {
  try {
    await pubsub.publish(eventName, payload)
    console.log(`Published event: ${eventName}`, { 
      timestamp: new Date().toISOString(),
      hasPayload: !!payload 
    })
  } catch (error) {
    console.error(`Error publishing event ${eventName}:`, error)
    throw error
  }
}

/**
 * Subscribe to an event
 * @param {string} eventName - Event name
 * @returns {AsyncIterator} - Event iterator
 */
const subscribeToEvent = (eventName) => {
  try {
    return pubsub.asyncIterator([eventName])
  } catch (error) {
    console.error(`Error subscribing to event ${eventName}:`, error)
    throw error
  }
}

/**
 * Subscribe to multiple events
 * @param {Array<string>} eventNames - Array of event names
 * @returns {AsyncIterator} - Event iterator
 */
const subscribeToMultipleEvents = (eventNames) => {
  try {
    return pubsub.asyncIterator(eventNames)
  } catch (error) {
    console.error(`Error subscribing to events ${eventNames.join(', ')}:`, error)
    throw error
  }
}

/**
 * Publish age verification status update
 * @param {string} userId - User ID
 * @param {Object} verificationInfo - Verification information
 */
const publishAgeVerificationUpdate = async (userId, verificationInfo) => {
  await publishEvent(SUBSCRIPTION_EVENTS.AGE_VERIFICATION_UPDATED, {
    ageVerificationStatusUpdated: verificationInfo,
    userId
  })
}

/**
 * Publish new age verification submission for admins
 * @param {Object} submissionData - Submission data
 */
const publishNewAgeVerificationSubmission = async (submissionData) => {
  await publishEvent(SUBSCRIPTION_EVENTS.NEW_AGE_VERIFICATION_SUBMISSION, {
    newAgeVerificationSubmission: submissionData
  })
}

/**
 * Publish user notification
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
const publishUserNotification = async (userId, notification) => {
  await publishEvent(SUBSCRIPTION_EVENTS.USER_NOTIFICATION, {
    userNotification: notification,
    userId
  })
}

/**
 * Publish admin notification
 * @param {Object} notification - Notification data
 */
const publishAdminNotification = async (notification) => {
  await publishEvent(SUBSCRIPTION_EVENTS.ADMIN_NOTIFICATION, {
    adminNotification: notification
  })
}

/**
 * Publish order status change
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {Object} orderData - Order data
 */
const publishOrderStatusChange = async (orderId, status, orderData) => {
  await publishEvent(SUBSCRIPTION_EVENTS.ORDER_STATUS_CHANGED, {
    orderStatusChanged: {
      orderId,
      status,
      order: orderData,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Publish new order for restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} orderData - Order data
 */
const publishNewOrderForRestaurant = async (restaurantId, orderData) => {
  await publishEvent(SUBSCRIPTION_EVENTS.NEW_ORDER_FOR_RESTAURANT, {
    newOrderForRestaurant: orderData,
    restaurantId
  })
}

/**
 * Publish new order for rider
 * @param {string} riderId - Rider ID
 * @param {Object} orderData - Order data
 */
const publishNewOrderForRider = async (riderId, orderData) => {
  await publishEvent(SUBSCRIPTION_EVENTS.NEW_ORDER_FOR_RIDER, {
    newOrderForRider: orderData,
    riderId
  })
}

/**
 * Publish rider location update
 * @param {string} riderId - Rider ID
 * @param {Object} location - Location data
 */
const publishRiderLocationUpdate = async (riderId, location) => {
  await publishEvent(SUBSCRIPTION_EVENTS.RIDER_LOCATION_UPDATED, {
    riderLocationUpdated: {
      riderId,
      location,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Publish chat message
 * @param {string} chatId - Chat ID
 * @param {Object} message - Message data
 */
const publishChatMessage = async (chatId, message) => {
  await publishEvent(SUBSCRIPTION_EVENTS.MESSAGE_SENT, {
    messageSent: message,
    chatId
  })
}

/**
 * Publish typing indicator
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID who is typing
 * @param {boolean} isTyping - Typing status
 */
const publishTypingIndicator = async (chatId, userId, isTyping) => {
  await publishEvent(SUBSCRIPTION_EVENTS.TYPING_INDICATOR, {
    typingIndicator: {
      chatId,
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Publish system alert
 * @param {Object} alert - Alert data
 */
const publishSystemAlert = async (alert) => {
  await publishEvent(SUBSCRIPTION_EVENTS.SYSTEM_ALERT, {
    systemAlert: {
      ...alert,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Clean up PubSub connections
 */
const cleanup = async () => {
  try {
    if (pubsub && typeof pubsub.close === 'function') {
      await pubsub.close()
      console.log('PubSub connections closed')
    }
  } catch (error) {
    console.error('Error closing PubSub connections:', error)
  }
}

// Handle process termination
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

module.exports = {
  pubsub,
  SUBSCRIPTION_EVENTS,
  publishEvent,
  subscribeToEvent,
  subscribeToMultipleEvents,
  publishAgeVerificationUpdate,
  publishNewAgeVerificationSubmission,
  publishUserNotification,
  publishAdminNotification,
  publishOrderStatusChange,
  publishNewOrderForRestaurant,
  publishNewOrderForRider,
  publishRiderLocationUpdate,
  publishChatMessage,
  publishTypingIndicator,
  publishSystemAlert,
  cleanup
}