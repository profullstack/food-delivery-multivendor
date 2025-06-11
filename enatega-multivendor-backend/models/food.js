const mongoose = require('mongoose')

const foodSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory'
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    variations: [{
      title: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      discountPrice: {
        type: Number,
        min: 0,
        default: 0
      },
      addons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Addon'
      }]
    }],
    addons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Addon'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    // Age verification fields for restricted items
    isRestrictedItem: {
      type: Boolean,
      default: false,
      index: true
    },
    restrictedItemType: {
      type: String,
      enum: ['TOBACCO', 'ALCOHOL', 'BOTH'],
      required: function() {
        return this.isRestrictedItem
      }
    },
    minimumAge: {
      type: Number,
      default: 21, // US federal requirement for tobacco and alcohol
      min: 18,
      max: 25
    },
    restrictionNote: {
      type: String,
      trim: true,
      default: 'Age verification required for purchase'
    },
    // Additional metadata
    tags: [{
      type: String,
      trim: true
    }],
    ingredients: [{
      type: String,
      trim: true
    }],
    allergens: [{
      type: String,
      trim: true
    }],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number
    },
    preparationTime: {
      type: Number, // in minutes
      min: 0,
      default: 15
    },
    spiceLevel: {
      type: String,
      enum: ['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'],
      default: 'MILD'
    },
    isVegetarian: {
      type: Boolean,
      default: false
    },
    isVegan: {
      type: Boolean,
      default: false
    },
    isGlutenFree: {
      type: Boolean,
      default: false
    },
    isDairyFree: {
      type: Boolean,
      default: false
    },
    // Analytics and tracking
    orderCount: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastOrdered: {
      type: Date
    },
    // SEO and search
    slug: {
      type: String,
      unique: true,
      sparse: true
    },
    searchKeywords: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Virtual for effective price (considering discount)
foodSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice > 0 ? this.discountPrice : this.price
})

// Virtual for discount percentage
foodSchema.virtual('discountPercentage').get(function() {
  if (this.discountPrice > 0 && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100)
  }
  return 0
})

// Virtual for checking if item is on sale
foodSchema.virtual('isOnSale').get(function() {
  return this.discountPrice > 0 && this.discountPrice < this.price
})

// Virtual for age verification requirement display
foodSchema.virtual('ageVerificationDisplay').get(function() {
  if (!this.isRestrictedItem) return null
  
  return {
    required: true,
    minimumAge: this.minimumAge,
    itemType: this.restrictedItemType,
    note: this.restrictionNote
  }
})

// Indexes for performance
foodSchema.index({ title: 'text', description: 'text', searchKeywords: 'text' })
foodSchema.index({ restaurant: 1, isActive: 1, isAvailable: 1 })
foodSchema.index({ category: 1, isActive: 1 })
foodSchema.index({ price: 1 })
foodSchema.index({ rating: -1 })
foodSchema.index({ orderCount: -1 })
foodSchema.index({ isRestrictedItem: 1, restrictedItemType: 1 })
foodSchema.index({ createdAt: -1 })
foodSchema.index({ slug: 1 })

// Compound indexes
foodSchema.index({ restaurant: 1, category: 1, isActive: 1 })
foodSchema.index({ isRestrictedItem: 1, restaurant: 1 })

// Pre-save middleware to generate slug
foodSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  next()
})

// Static method to find restricted items
foodSchema.statics.findRestrictedItems = function(restaurantId = null) {
  const query = { isRestrictedItem: true, isActive: true }
  if (restaurantId) {
    query.restaurant = restaurantId
  }
  return this.find(query).populate('restaurant category')
}

// Static method to find items by restriction type
foodSchema.statics.findByRestrictionType = function(restrictionType, restaurantId = null) {
  const query = { 
    isRestrictedItem: true, 
    restrictedItemType: restrictionType,
    isActive: true 
  }
  if (restaurantId) {
    query.restaurant = restaurantId
  }
  return this.find(query).populate('restaurant category')
}

// Static method to check if any items in cart are restricted
foodSchema.statics.checkCartForRestrictedItems = async function(foodIds) {
  const restrictedItems = await this.find({
    _id: { $in: foodIds },
    isRestrictedItem: true,
    isActive: true
  }).select('_id title restrictedItemType minimumAge')
  
  return restrictedItems.map(item => ({
    foodId: item._id,
    title: item.title,
    restrictedItemType: item.restrictedItemType,
    minimumAge: item.minimumAge
  }))
}

// Instance method to check if user can purchase this item
foodSchema.methods.canUserPurchase = function(userAge) {
  if (!this.isRestrictedItem) return true
  return userAge >= this.minimumAge
}

// Instance method to get restriction info
foodSchema.methods.getRestrictionInfo = function() {
  if (!this.isRestrictedItem) return null
  
  return {
    isRestricted: true,
    itemType: this.restrictedItemType,
    minimumAge: this.minimumAge,
    note: this.restrictionNote
  }
}

const Food = mongoose.model('Food', foodSchema)

module.exports = Food