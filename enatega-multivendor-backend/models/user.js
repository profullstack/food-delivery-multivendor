import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: function() {
        return !this.appleId && !this.googleId && !this.facebookId
      },
      minlength: 6
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },
    avatar: {
      type: String,
      default: null
    },
    // OAuth provider IDs
    appleId: {
      type: String,
      sparse: true,
      unique: true
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    facebookId: {
      type: String,
      sparse: true,
      unique: true
    },
    // User type and status
    userType: {
      type: String,
      enum: ['CUSTOMER', 'SUPER_ADMIN', 'RESTAURANT_ADMIN', 'DELIVERY_RIDER'],
      default: 'CUSTOMER'
    },
    permissions: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    // Address information
    addresses: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      address: {
        type: String,
        required: true,
        trim: true
      },
      details: {
        type: String,
        trim: true
      },
      label: {
        type: String,
        enum: ['HOME', 'WORK', 'OTHER'],
        default: 'HOME'
      },
      location: {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        }
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    }],
    // Notification settings
    notificationToken: {
      type: String,
      sparse: true
    },
    notificationSettings: {
      orderUpdates: {
        type: Boolean,
        default: true
      },
      promotions: {
        type: Boolean,
        default: true
      },
      ageVerificationUpdates: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      }
    },
    // Age verification status (virtual field populated from AgeVerification model)
    dateOfBirth: {
      type: Date
    },
    // Preferences
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'ar', 'zh', 'he', 'km']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    // Security and verification
    emailVerificationToken: {
      type: String,
      sparse: true
    },
    emailVerificationExpires: {
      type: Date
    },
    passwordResetToken: {
      type: String,
      sparse: true
    },
    passwordResetExpires: {
      type: Date
    },
    phoneVerificationCode: {
      type: String,
      sparse: true
    },
    phoneVerificationExpires: {
      type: Date
    },
    // Login tracking
    lastLogin: {
      type: Date
    },
    loginCount: {
      type: Number,
      default: 0
    },
    // Account restrictions
    isBanned: {
      type: Boolean,
      default: false
    },
    banReason: {
      type: String,
      trim: true
    },
    banExpiresAt: {
      type: Date
    },
    // Analytics
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    lastOrderDate: {
      type: Date
    },
    // Referral system
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referralCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password
        delete ret.emailVerificationToken
        delete ret.passwordResetToken
        delete ret.phoneVerificationCode
        return ret
      }
    },
    toObject: { virtuals: true }
  }
)

// Virtual for full name (if needed)
userSchema.virtual('fullName').get(function() {
  return this.name
})

// Virtual for age calculation
userSchema.virtual('age').get(function() {
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

// Virtual for default address
userSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0] || null
})

// Virtual for account status
userSchema.virtual('accountStatus').get(function() {
  if (this.isBanned) {
    if (this.banExpiresAt && this.banExpiresAt > new Date()) {
      return 'TEMPORARILY_BANNED'
    }
    return 'BANNED'
  }
  if (!this.isActive) return 'INACTIVE'
  if (!this.isEmailVerified) return 'PENDING_EMAIL_VERIFICATION'
  return 'ACTIVE'
})

// Indexes for performance
userSchema.index({ email: 1 })
userSchema.index({ phone: 1 })
userSchema.index({ userType: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ lastLogin: -1 })
userSchema.index({ referralCode: 1 })
userSchema.index({ 'addresses.location': '2dsphere' })

// Compound indexes
userSchema.index({ userType: 1, isActive: 1 })
userSchema.index({ email: 1, userType: 1 })

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists
  if (!this.isModified('password') || !this.password) {
    return next()
  }
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Pre-save middleware to generate referral code
userSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = this._id.toString().substring(0, 8).toUpperCase()
  }
  next()
})

// Pre-save middleware to ensure only one default address
userSchema.pre('save', function(next) {
  if (this.isModified('addresses')) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault)
    if (defaultAddresses.length > 1) {
      // Keep only the first default address
      this.addresses.forEach((addr, index) => {
        if (index > 0 && addr.isDefault) {
          addr.isDefault = false
        }
      })
    }
  }
  next()
})

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15)
  this.emailVerificationToken = token
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  return token
}

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15)
  this.passwordResetToken = token
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  return token
}

// Instance method to generate phone verification code
userSchema.methods.generatePhoneVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
  this.phoneVerificationCode = code
  this.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  return code
}

// Instance method to add address
userSchema.methods.addAddress = function(addressData) {
  // If this is the first address or marked as default, make it default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Remove default from other addresses
    this.addresses.forEach(addr => {
      addr.isDefault = false
    })
    addressData.isDefault = true
  }
  
  this.addresses.push(addressData)
  return this.addresses[this.addresses.length - 1]
}

// Instance method to update login tracking
userSchema.methods.updateLoginTracking = function() {
  this.lastLogin = new Date()
  this.loginCount += 1
}

// Static method to find users by location
userSchema.statics.findByLocation = function(latitude, longitude, radiusInKm = 10) {
  return this.find({
    'addresses.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    },
    isActive: true
  })
}

// Static method to find admins
userSchema.statics.findAdmins = function() {
  return this.find({
    userType: { $in: ['SUPER_ADMIN', 'RESTAURANT_ADMIN'] },
    isActive: true
  }).select('name email notificationToken userType permissions')
}

// Static method to get user statistics
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$userType',
        count: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
      }
    }
  ])
  
  return stats
}

const User = mongoose.model('User', userSchema)

export default User