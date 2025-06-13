import { GraphQLError } from 'graphql'
import { withFilter } from 'graphql-subscriptions'
import { createRequire } from 'module'

// Use createRequire to import CommonJS modules
const require = createRequire(import.meta.url)
const AgeVerification = require('../../models/ageVerification.js')
const User = require('../../models/user.js')
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('../../helpers/cloudinary.js')
const { sendNotificationToUser } = require('../../helpers/notifications.js')
const { validateAge, validateDocumentType } = require('../../helpers/validation.js')
const pubsub = require('../../helpers/pubsub.js')

const AGE_VERIFICATION_UPDATED = 'AGE_VERIFICATION_UPDATED'
const NEW_AGE_VERIFICATION_SUBMISSION = 'NEW_AGE_VERIFICATION_SUBMISSION'

const ageVerificationResolvers = {
  Query: {
    getAgeVerificationStatus: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' }
      })
      
      const verification = await AgeVerification.findOne({ user: user._id })
      
      if (!verification) {
        return {
          isVerified: false,
          status: 'PENDING',
          canPurchaseRestricted: false,
          restrictedItemTypes: [],
          age: null
        }
      }
      
      return {
        isVerified: verification.isValid,
        status: verification.status,
        document: verification,
        canPurchaseRestricted: verification.canPurchaseRestricted,
        restrictedItemTypes: verification.restrictedItemTypes,
        verificationExpiryDate: verification.expiryDate,
        dateOfBirth: verification.dateOfBirth,
        age: verification.age
      }
    },

    getAgeVerificationReviews: async (_, { limit = 20, offset = 0 }, { user }) => {
      if (!user || user.userType !== 'ADMIN') {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      const reviews = await AgeVerification.getPendingReviews(limit, offset)
      
      return reviews.map(verification => ({
        _id: verification._id,
        user: verification.user,
        document: verification,
        submittedAt: verification.submittedAt,
        priority: verification.getReviewPriority()
      }))
    },

    canPurchaseRestrictedItem: async (_, { itemType }, { user }) => {
      if (!user) return false
      
      return await AgeVerification.canUserPurchaseRestricted(user._id, itemType)
    }
  },

  Mutation: {
    uploadAgeVerificationDocument: async (_, { file, input }, { user }) => {
      if (!user) throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' }
      })
      
      try {
        // Validate input
        const { documentType, dateOfBirth } = input
        
        if (!validateDocumentType(documentType)) {
          throw new GraphQLError('Invalid document type', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        const birthDate = new Date(dateOfBirth)
        if (!validateAge(birthDate)) {
          throw new GraphQLError('Invalid date of birth or user is under 18', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        // Check if user already has a verification
        const existingVerification = await AgeVerification.findOne({ user: user._id })
        
        if (existingVerification && existingVerification.status === 'VERIFIED') {
          throw new GraphQLError('User already has verified age verification', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        // Process file upload
        const { createReadStream, filename, mimetype, encoding } = await file
        
        // Validate file
        if (!['image/jpeg', 'image/png'].includes(mimetype)) {
          throw new GraphQLError('Only JPEG and PNG files are allowed', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        const stream = createReadStream()
        const chunks = []
        
        for await (const chunk of stream) {
          chunks.push(chunk)
        }
        
        const buffer = Buffer.concat(chunks)
        
        // Check file size (5MB limit)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new GraphQLError('File size must be less than 5MB', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        // Upload to Cloudinary
        const uploadResult = await uploadImageToCloudinary(
          buffer,
          `age-verification/${user._id}`,
          {
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto:good',
            fetch_format: 'auto'
          }
        )
        
        // Create thumbnail
        const thumbnailResult = await uploadImageToCloudinary(
          buffer,
          `age-verification/${user._id}/thumbnail`,
          {
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto:low',
            width: 200,
            height: 200,
            crop: 'fill'
          }
        )
        
        // Delete existing verification if any
        if (existingVerification) {
          if (existingVerification.document.publicId) {
            await deleteImageFromCloudinary(existingVerification.document.publicId)
          }
          await AgeVerification.deleteOne({ user: user._id })
        }
        
        // Create new verification record
        const verification = new AgeVerification({
          user: user._id,
          document: {
            url: uploadResult.secure_url,
            thumbnailUrl: thumbnailResult.secure_url,
            publicId: uploadResult.public_id,
            documentType,
            fileSize: buffer.length,
            mimeType: mimetype,
            originalName: filename
          },
          dateOfBirth: birthDate,
          status: 'PENDING',
          restrictedItemTypes: ['BOTH']
        })
        
        await verification.save()
        
        // Notify admins of new submission
        pubsub.publish(NEW_AGE_VERIFICATION_SUBMISSION, {
          newAgeVerificationSubmission: {
            _id: verification._id,
            user: await User.findById(user._id),
            document: verification,
            submittedAt: verification.submittedAt,
            priority: verification.getReviewPriority()
          }
        })
        
        const verificationInfo = {
          isVerified: verification.isValid,
          status: verification.status,
          document: verification,
          canPurchaseRestricted: verification.canPurchaseRestricted,
          restrictedItemTypes: verification.restrictedItemTypes,
          verificationExpiryDate: verification.expiryDate,
          dateOfBirth: verification.dateOfBirth,
          age: verification.age
        }
        
        return {
          success: true,
          message: 'Age verification document uploaded successfully. Review pending.',
          document: verification,
          verificationInfo
        }
        
      } catch (error) {
        console.error('Age verification upload error:', error)
        throw new GraphQLError(error.message || 'Failed to upload age verification document', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
    },

    reviewAgeVerification: async (_, { input }, { user }) => {
      if (!user || user.userType !== 'ADMIN') {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      try {
        const { userId, status, rejectionReason, dateOfBirth } = input
        
        const verification = await AgeVerification.findOne({ user: userId })
        
        if (!verification) {
          throw new GraphQLError('Age verification not found', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        if (verification.status !== 'PENDING') {
          throw new GraphQLError('Age verification has already been reviewed', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        // Update verification
        verification.status = status
        verification.verifiedBy = user._id
        verification.reviewedAt = new Date()
        
        if (status === 'REJECTED') {
          verification.rejectionReason = rejectionReason
        } else if (status === 'VERIFIED') {
          verification.verifiedAt = new Date()
          if (dateOfBirth) {
            verification.dateOfBirth = new Date(dateOfBirth)
          }
        }
        
        await verification.save()
        
        // Send notification to user
        const targetUser = await User.findById(userId)
        if (targetUser) {
          const notificationMessage = status === 'VERIFIED' 
            ? 'Your age verification has been approved. You can now purchase restricted items.'
            : `Your age verification was rejected. Reason: ${rejectionReason}`
          
          await sendNotificationToUser(targetUser, {
            title: 'Age Verification Update',
            body: notificationMessage,
            data: {
              type: 'AGE_VERIFICATION_UPDATE',
              status,
              verificationId: verification._id.toString()
            }
          })
        }
        
        // Publish subscription update
        const verificationInfo = {
          isVerified: verification.isValid,
          status: verification.status,
          document: verification,
          canPurchaseRestricted: verification.canPurchaseRestricted,
          restrictedItemTypes: verification.restrictedItemTypes,
          verificationExpiryDate: verification.expiryDate,
          dateOfBirth: verification.dateOfBirth,
          age: verification.age
        }
        
        pubsub.publish(AGE_VERIFICATION_UPDATED, {
          ageVerificationStatusUpdated: verificationInfo,
          userId: userId
        })
        
        return {
          success: true,
          message: `Age verification ${status.toLowerCase()} successfully`,
          document: verification,
          verificationInfo
        }
        
      } catch (error) {
        console.error('Age verification review error:', error)
        throw new GraphQLError(error.message || 'Failed to review age verification', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
    },

    deleteAgeVerificationDocument: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' }
      })
      
      try {
        const verification = await AgeVerification.findOne({ user: user._id })
        
        if (!verification) {
          throw new GraphQLError('No age verification found', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        // Delete from Cloudinary
        if (verification.document.publicId) {
          await deleteImageFromCloudinary(verification.document.publicId)
        }
        
        // Delete from database
        await AgeVerification.deleteOne({ user: user._id })
        
        return true
        
      } catch (error) {
        console.error('Delete age verification error:', error)
        throw new GraphQLError('Failed to delete age verification document', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
    }
  },

  Subscription: {
    ageVerificationStatusUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([AGE_VERIFICATION_UPDATED]),
        (payload, variables, context) => {
          return payload.userId === context.user?._id?.toString()
        }
      )
    },

    newAgeVerificationSubmission: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([NEW_AGE_VERIFICATION_SUBMISSION]),
        (payload, variables, context) => {
          return context.user?.userType === 'ADMIN'
        }
      )
    }
  },

  // Field resolvers
  User: {
    ageVerification: async (parent) => {
      const verification = await AgeVerification.findOne({ user: parent._id })
      
      if (!verification) {
        return {
          isVerified: false,
          status: 'PENDING',
          canPurchaseRestricted: false,
          restrictedItemTypes: [],
          age: null
        }
      }
      
      return {
        isVerified: verification.isValid,
        status: verification.status,
        document: verification,
        canPurchaseRestricted: verification.canPurchaseRestricted,
        restrictedItemTypes: verification.restrictedItemTypes,
        verificationExpiryDate: verification.expiryDate,
        dateOfBirth: verification.dateOfBirth,
        age: verification.age
      }
    }
  }
}

export default ageVerificationResolvers