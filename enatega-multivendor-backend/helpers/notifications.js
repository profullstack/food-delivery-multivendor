const admin = require('firebase-admin')
const { PubSub } = require('graphql-subscriptions')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../config/firebase-service-account.json')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    })
  } catch (error) {
    console.warn('Firebase Admin not initialized:', error.message)
  }
}

const pubsub = new PubSub()

/**
 * Send push notification to a specific user
 * @param {Object} user - User object with notification tokens
 * @param {Object} notification - Notification payload
 * @returns {Promise<Object>} - Notification result
 */
const sendNotificationToUser = async (user, notification) => {
  try {
    if (!user || !user.notificationToken) {
      console.log('No notification token found for user:', user?._id)
      return { success: false, reason: 'No notification token' }
    }

    const { title, body, data = {} } = notification

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        userId: user._id.toString(),
        timestamp: new Date().toISOString()
      },
      token: user.notificationToken,
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
          channelId: 'age_verification'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body
            },
            sound: 'default',
            badge: 1
          }
        }
      }
    }

    const response = await admin.messaging().send(message)
    
    console.log('Notification sent successfully:', response)
    return { success: true, messageId: response }

  } catch (error) {
    console.error('Error sending notification:', error)
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('Invalid token, should remove from user:', user._id)
      // TODO: Remove invalid token from user record
    }
    
    return { success: false, error: error.message }
  }
}

/**
 * Send notifications to multiple users
 * @param {Array} users - Array of user objects
 * @param {Object} notification - Notification payload
 * @returns {Promise<Object>} - Batch notification result
 */
const sendNotificationToMultipleUsers = async (users, notification) => {
  try {
    const validUsers = users.filter(user => user && user.notificationToken)
    
    if (validUsers.length === 0) {
      return { success: false, reason: 'No valid notification tokens' }
    }

    const { title, body, data = {} } = notification
    const tokens = validUsers.map(user => user.notificationToken)

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      tokens,
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
          channelId: 'age_verification'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body
            },
            sound: 'default',
            badge: 1
          }
        }
      }
    }

    const response = await admin.messaging().sendMulticast(message)
    
    console.log('Batch notifications sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    })

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            error: resp.error?.code,
            userId: validUsers[idx]._id
          })
        }
      })
      console.log('Failed tokens:', failedTokens)
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    }

  } catch (error) {
    console.error('Error sending batch notifications:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send age verification status notification
 * @param {Object} user - User object
 * @param {string} status - Verification status (VERIFIED, REJECTED)
 * @param {string} rejectionReason - Reason for rejection (if applicable)
 * @returns {Promise<Object>} - Notification result
 */
const sendAgeVerificationNotification = async (user, status, rejectionReason = null) => {
  const notifications = {
    VERIFIED: {
      title: '✅ Age Verification Approved',
      body: 'Your ID has been verified! You can now purchase restricted items.',
      data: {
        type: 'AGE_VERIFICATION_APPROVED',
        status: 'VERIFIED'
      }
    },
    REJECTED: {
      title: '❌ Age Verification Rejected',
      body: rejectionReason || 'Your ID verification was rejected. Please upload a new document.',
      data: {
        type: 'AGE_VERIFICATION_REJECTED',
        status: 'REJECTED',
        rejectionReason
      }
    }
  }

  const notification = notifications[status]
  if (!notification) {
    throw new Error(`Invalid verification status: ${status}`)
  }

  return await sendNotificationToUser(user, notification)
}

/**
 * Send notification to admins about new age verification submission
 * @param {Array} adminUsers - Array of admin user objects
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} - Notification result
 */
const notifyAdminsOfNewSubmission = async (adminUsers, submissionData) => {
  const notification = {
    title: '📋 New Age Verification Submission',
    body: `${submissionData.userName} submitted ID for verification`,
    data: {
      type: 'NEW_AGE_VERIFICATION_SUBMISSION',
      userId: submissionData.userId,
      userName: submissionData.userName,
      submissionId: submissionData.submissionId
    }
  }

  return await sendNotificationToMultipleUsers(adminUsers, notification)
}

/**
 * Send reminder notification for pending verification
 * @param {Object} user - User object
 * @param {number} daysPending - Number of days verification has been pending
 * @returns {Promise<Object>} - Notification result
 */
const sendVerificationReminderNotification = async (user, daysPending) => {
  const notification = {
    title: '⏰ Age Verification Pending',
    body: `Your ID verification has been pending for ${daysPending} days. We'll review it soon!`,
    data: {
      type: 'AGE_VERIFICATION_REMINDER',
      daysPending: daysPending.toString()
    }
  }

  return await sendNotificationToUser(user, notification)
}

/**
 * Send notification when user tries to purchase restricted item without verification
 * @param {Object} user - User object
 * @param {string} itemName - Name of restricted item
 * @returns {Promise<Object>} - Notification result
 */
const sendRestrictedItemNotification = async (user, itemName) => {
  const notification = {
    title: '🔞 Age Verification Required',
    body: `To purchase ${itemName}, please verify your age by uploading a valid ID.`,
    data: {
      type: 'AGE_VERIFICATION_REQUIRED',
      itemName,
      action: 'UPLOAD_ID'
    }
  }

  return await sendNotificationToUser(user, notification)
}

/**
 * Create in-app notification record
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Created notification record
 */
const createInAppNotification = async (userId, notification) => {
  try {
    // This would typically save to a notifications collection in MongoDB
    const notificationRecord = {
      userId,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      type: notification.data?.type || 'GENERAL',
      isRead: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }

    // TODO: Save to database
    console.log('In-app notification created:', notificationRecord)
    
    return notificationRecord
  } catch (error) {
    console.error('Error creating in-app notification:', error)
    throw error
  }
}

/**
 * Send email notification (placeholder for email service integration)
 * @param {string} email - User email
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} - Email result
 */
const sendEmailNotification = async (email, emailData) => {
  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Email notification would be sent to:', email, emailData)
    
    return { success: true, message: 'Email notification queued' }
  } catch (error) {
    console.error('Error sending email notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Publish GraphQL subscription event
 * @param {string} eventName - Event name
 * @param {Object} payload - Event payload
 */
const publishSubscriptionEvent = (eventName, payload) => {
  try {
    pubsub.publish(eventName, payload)
    console.log(`Published subscription event: ${eventName}`)
  } catch (error) {
    console.error('Error publishing subscription event:', error)
  }
}

/**
 * Get notification preferences for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User notification preferences
 */
const getUserNotificationPreferences = async (userId) => {
  try {
    // TODO: Get from database
    return {
      pushNotifications: true,
      emailNotifications: true,
      ageVerificationUpdates: true,
      orderUpdates: true,
      promotionalMessages: false
    }
  } catch (error) {
    console.error('Error getting notification preferences:', error)
    return null
  }
}

module.exports = {
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendAgeVerificationNotification,
  notifyAdminsOfNewSubmission,
  sendVerificationReminderNotification,
  sendRestrictedItemNotification,
  createInAppNotification,
  sendEmailNotification,
  publishSubscriptionEvent,
  getUserNotificationPreferences,
  pubsub
}