const mongoose = require('mongoose')

const ageVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    document: {
      url: {
        type: String,
        required: true
      },
      thumbnailUrl: {
        type: String
      },
      publicId: {
        type: String,
        required: true
      },
      documentType: {
        type: String,
        required: true,
        enum: ['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'STATE_ID']
      },
      fileSize: {
        type: Number,
        required: true
      },
      mimeType: {
        type: String,
        required: true,
        enum: ['image/jpeg', 'image/png']
      },
      originalName: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING'
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    verifiedAt: {
      type: Date
    },
    expiryDate: {
      type: Date,
      // Age verification expires after 1 year
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    rejectionReason: {
      type: String
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    restrictedItemTypes: [{
      type: String,
      enum: ['TOBACCO', 'ALCOHOL', 'BOTH'],
      default: 'BOTH'
    }],
    // Audit trail
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date
    },
    lastAccessedAt: {
      type: Date
    },
    accessCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Virtual for calculating age
ageVerificationSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(this.dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
})

// Virtual for checking if verification is valid
ageVerificationSchema.virtual('isValid').get(function() {
  return this.status === 'VERIFIED' && 
         this.expiryDate > new Date() && 
         this.age >= 18
})

// Virtual for checking if can purchase restricted items
ageVerificationSchema.virtual('canPurchaseRestricted').get(function() {
  return this.isValid && this.age >= 21 // US legal drinking/smoking age
})

// Indexes for performance
ageVerificationSchema.index({ user: 1 })
ageVerificationSchema.index({ status: 1 })
ageVerificationSchema.index({ expiryDate: 1 })
ageVerificationSchema.index({ submittedAt: -1 })
ageVerificationSchema.index({ 'document.documentType': 1 })

// Middleware to update lastAccessedAt when document is accessed
ageVerificationSchema.pre('findOne', function() {
  this.set({ lastAccessedAt: new Date(), $inc: { accessCount: 1 } })
})

// Static method to check if user can purchase restricted items
ageVerificationSchema.statics.canUserPurchaseRestricted = async function(userId, itemType = 'BOTH') {
  const verification = await this.findOne({ 
    user: userId, 
    status: 'VERIFIED',
    expiryDate: { $gt: new Date() }
  })
  
  if (!verification) return false
  
  const age = verification.age
  
  // Check age requirements based on item type
  switch (itemType) {
    case 'TOBACCO':
      return age >= 21 // US tobacco age
    case 'ALCOHOL':
      return age >= 21 // US drinking age
    case 'BOTH':
      return age >= 21
    default:
      return false
  }
}

// Static method to get pending reviews
ageVerificationSchema.statics.getPendingReviews = function(limit = 20, offset = 0) {
  return this.find({ status: 'PENDING' })
    .populate('user', 'name email phone')
    .sort({ submittedAt: 1 }) // FIFO order
    .limit(limit)
    .skip(offset)
}

// Static method to clean up expired verifications
ageVerificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      status: 'VERIFIED',
      expiryDate: { $lt: new Date() }
    },
    { 
      status: 'EXPIRED' 
    }
  )
}

// Method to calculate priority for review queue
ageVerificationSchema.methods.getReviewPriority = function() {
  const hoursWaiting = (new Date() - this.submittedAt) / (1000 * 60 * 60)
  
  // Higher priority for longer waiting times
  if (hoursWaiting > 48) return 1 // Critical - over 2 days
  if (hoursWaiting > 24) return 2 // High - over 1 day
  if (hoursWaiting > 12) return 3 // Medium - over 12 hours
  return 4 // Normal - under 12 hours
}

const AgeVerification = mongoose.model('AgeVerification', ageVerificationSchema)

module.exports = AgeVerification