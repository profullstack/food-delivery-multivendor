// User GraphQL Resolvers
import jwt from 'jsonwebtoken'
import { GraphQLError } from 'graphql'
import User from '../../models/user.js'

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'cigar-underground-secret-key-2024'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      userType: user.userType 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * Verify JWT token and return user
 * @param {string} token - JWT token
 * @returns {Object} User object
 */
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      throw new GraphQLError('User not found or inactive', {
        extensions: { code: 'UNAUTHENTICATED' }
      })
    }
    return user
  } catch (error) {
    throw new GraphQLError('Invalid or expired token', {
      extensions: { code: 'UNAUTHENTICATED' }
    })
  }
}

const userResolvers = {
  Query: {
    // Get current user from token
    me: async (parent, args, context) => {
      const token = context.token || context.req?.headers?.authorization?.replace('Bearer ', '')
      if (!token) {
        throw new GraphQLError('No token provided', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }
      
      return await verifyToken(token)
    },

    // Get all users (admin only)
    users: async (parent, args, context) => {
      // TODO: Add authentication middleware
      try {
        return await User.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(100)
      } catch (error) {
        throw new GraphQLError('Failed to fetch users', {
          extensions: { code: 'INTERNAL_ERROR' }
        })
      }
    }
  },

  Mutation: {
    // User login
    login: async (parent, { email, password }) => {
      try {
        // Find user by email
        const user = await User.findOne({ 
          email: email.toLowerCase(),
          isActive: true 
        })

        if (!user) {
          throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'AUTHENTICATION_ERROR' }
          })
        }

        // Check if account is banned
        if (user.isBanned) {
          const banMessage = user.banExpiresAt && user.banExpiresAt > new Date() 
            ? `Account temporarily banned until ${user.banExpiresAt.toISOString()}`
            : 'Account permanently banned'
          
          throw new GraphQLError(banMessage, {
            extensions: { code: 'ACCOUNT_BANNED' }
          })
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password)
        if (!isValidPassword) {
          throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'AUTHENTICATION_ERROR' }
          })
        }

        // Update login tracking
        user.updateLoginTracking()
        await user.save()

        // Generate token
        const token = generateToken(user)

        return {
          token,
          user
        }
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        
        console.error('Login error:', error)
        throw new GraphQLError('Login failed', {
          extensions: { code: 'INTERNAL_ERROR' }
        })
      }
    },

    // User registration
    register: async (parent, { input }) => {
      try {
        const { name, email, password, phone, dateOfBirth } = input

        // Check if user already exists
        const existingUser = await User.findOne({ 
          email: email.toLowerCase() 
        })

        if (existingUser) {
          throw new GraphQLError('User with this email already exists', {
            extensions: { code: 'USER_EXISTS' }
          })
        }

        // Check if phone is already used
        if (phone) {
          const existingPhone = await User.findOne({ phone })
          if (existingPhone) {
            throw new GraphQLError('User with this phone number already exists', {
              extensions: { code: 'PHONE_EXISTS' }
            })
          }
        }

        // Create new user
        const user = new User({
          name: name.trim(),
          email: email.toLowerCase(),
          password,
          phone,
          dateOfBirth,
          userType: 'CUSTOMER',
          permissions: [],
          isActive: true,
          isEmailVerified: false // TODO: Implement email verification
        })

        await user.save()

        // Generate token
        const token = generateToken(user)

        return {
          token,
          user
        }
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map(err => err.message)
          throw new GraphQLError(`Validation error: ${messages.join(', ')}`, {
            extensions: { code: 'VALIDATION_ERROR' }
          })
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
          const field = Object.keys(error.keyPattern)[0]
          throw new GraphQLError(`${field} already exists`, {
            extensions: { code: 'DUPLICATE_ERROR' }
          })
        }

        console.error('Registration error:', error)
        throw new GraphQLError('Registration failed', {
          extensions: { code: 'INTERNAL_ERROR' }
        })
      }
    },

    // Update user profile
    updateProfile: async (parent, { input }, context) => {
      const token = context.token || context.req?.headers?.authorization?.replace('Bearer ', '')
      if (!token) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      try {
        const currentUser = await verifyToken(token)
        const { name, phone, address } = input

        // Update user fields
        if (name) currentUser.name = name.trim()
        if (phone) currentUser.phone = phone
        if (address) {
          // Add address to addresses array if it doesn't exist
          if (!currentUser.addresses.some(addr => addr.address === address)) {
            currentUser.addAddress({
              title: 'Default',
              address,
              label: 'HOME',
              location: { latitude: 0, longitude: 0 }, // TODO: Geocode address
              isDefault: currentUser.addresses.length === 0
            })
          }
        }

        await currentUser.save()
        return currentUser
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }

        console.error('Profile update error:', error)
        throw new GraphQLError('Failed to update profile', {
          extensions: { code: 'INTERNAL_ERROR' }
        })
      }
    }
  },

  Subscription: {
    // TODO: Implement user-related subscriptions
  }
}

export default userResolvers