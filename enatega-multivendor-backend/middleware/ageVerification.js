const { GraphQLError } = require('graphql')
const AgeVerification = require('../models/ageVerification')
const Food = require('../models/food')

/**
 * Middleware to check age verification for restricted items
 * @param {Object} user - User object from context
 * @param {Array} items - Array of cart items with foodId and quantity
 * @returns {Promise<boolean>} - True if user can purchase all items
 */
const checkAgeVerificationForItems = async (user, items) => {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    })
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return true // No items to check
  }
  
  // Get all food items from the cart
  const foodIds = items.map(item => item.foodId || item.food)
  const foods = await Food.find({ _id: { $in: foodIds } })
  
  // Check if any items are restricted
  const restrictedItems = foods.filter(food => 
    food.isRestrictedItem && 
    (food.restrictedItemType === 'TOBACCO' || 
     food.restrictedItemType === 'ALCOHOL' || 
     food.restrictedItemType === 'BOTH')
  )
  
  if (restrictedItems.length === 0) {
    return true // No restricted items in cart
  }
  
  // Check user's age verification status
  const verification = await AgeVerification.findOne({ user: user._id })
  
  if (!verification) {
    throw new GraphQLError(
      'Age verification required to purchase restricted items. Please upload a valid ID document.',
      { extensions: { code: 'FORBIDDEN' } }
    )
  }
  
  if (verification.status !== 'VERIFIED') {
    const statusMessage = verification.status === 'PENDING' 
      ? 'Your age verification is still being reviewed.'
      : 'Your age verification was rejected. Please upload a new document.'
    
    throw new GraphQLError(
      `Age verification required to purchase restricted items. ${statusMessage}`,
      { extensions: { code: 'FORBIDDEN' } }
    )
  }
  
  if (!verification.isValid) {
    throw new GraphQLError(
      'Your age verification has expired. Please upload a new document.',
      { extensions: { code: 'FORBIDDEN' } }
    )
  }
  
  // Check if user can purchase each restricted item type
  for (const item of restrictedItems) {
    const canPurchase = await AgeVerification.canUserPurchaseRestricted(
      user._id, 
      item.restrictedItemType
    )
    
    if (!canPurchase) {
      throw new GraphQLError(
        `You are not eligible to purchase ${item.title}. Age verification required for ${item.restrictedItemType.toLowerCase()} products.`,
        { extensions: { code: 'FORBIDDEN' } }
      )
    }
  }
  
  return true
}

/**
 * Middleware function for GraphQL resolvers
 * Usage: Add this to order creation resolvers
 */
const ageVerificationMiddleware = async (resolve, parent, args, context, info) => {
  const { user } = context
  const { orderInput } = args
  
  if (orderInput && orderInput.items) {
    await checkAgeVerificationForItems(user, orderInput.items)
  }
  
  return resolve(parent, args, context, info)
}

/**
 * Check if a specific food item requires age verification
 * @param {string} foodId - Food item ID
 * @returns {Promise<Object>} - Object with requiresVerification and itemType
 */
const checkFoodItemRestriction = async (foodId) => {
  const food = await Food.findById(foodId)
  
  if (!food) {
    throw new GraphQLError('Food item not found', {
      extensions: { code: 'BAD_USER_INPUT' }
    })
  }
  
  return {
    requiresVerification: food.isRestrictedItem || false,
    itemType: food.restrictedItemType || null,
    itemName: food.title
  }
}

/**
 * Bulk check for multiple food items
 * @param {Array} foodIds - Array of food item IDs
 * @returns {Promise<Array>} - Array of restriction info for each item
 */
const checkMultipleFoodItemRestrictions = async (foodIds) => {
  const foods = await Food.find({ _id: { $in: foodIds } })
  
  return foods.map(food => ({
    foodId: food._id,
    requiresVerification: food.isRestrictedItem || false,
    itemType: food.restrictedItemType || null,
    itemName: food.title
  }))
}

/**
 * Get user's age verification summary for frontend
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Verification summary
 */
const getUserVerificationSummary = async (userId) => {
  const verification = await AgeVerification.findOne({ user: userId })
  
  if (!verification) {
    return {
      hasVerification: false,
      isVerified: false,
      status: 'NONE',
      canPurchaseAlcohol: false,
      canPurchaseTobacco: false,
      age: null,
      expiryDate: null
    }
  }
  
  return {
    hasVerification: true,
    isVerified: verification.isValid,
    status: verification.status,
    canPurchaseAlcohol: verification.canPurchaseRestricted && 
                       (verification.restrictedItemTypes.includes('ALCOHOL') || 
                        verification.restrictedItemTypes.includes('BOTH')),
    canPurchaseTobacco: verification.canPurchaseRestricted && 
                       (verification.restrictedItemTypes.includes('TOBACCO') || 
                        verification.restrictedItemTypes.includes('BOTH')),
    age: verification.age,
    expiryDate: verification.expiryDate,
    rejectionReason: verification.rejectionReason
  }
}

/**
 * Express middleware for REST endpoints (if needed)
 */
const expressAgeVerificationMiddleware = async (req, res, next) => {
  try {
    const { user } = req
    const { items } = req.body
    
    if (items && Array.isArray(items)) {
      await checkAgeVerificationForItems(user, items)
    }
    
    next()
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
      code: 'AGE_VERIFICATION_REQUIRED'
    })
  }
}

/**
 * Utility function to add age verification warnings to cart
 * @param {Array} cartItems - Cart items with food details
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Cart with verification warnings
 */
const addAgeVerificationWarnings = async (cartItems, userId) => {
  const userSummary = await getUserVerificationSummary(userId)
  const warnings = []
  const restrictedItems = []
  
  for (const item of cartItems) {
    if (item.food && item.food.isRestrictedItem) {
      restrictedItems.push({
        itemId: item.food._id,
        itemName: item.food.title,
        itemType: item.food.restrictedItemType,
        quantity: item.quantity
      })
      
      if (!userSummary.isVerified) {
        warnings.push({
          type: 'AGE_VERIFICATION_REQUIRED',
          message: `Age verification required for ${item.food.title}`,
          itemId: item.food._id,
          action: 'UPLOAD_ID'
        })
      } else if (
        (item.food.restrictedItemType === 'ALCOHOL' && !userSummary.canPurchaseAlcohol) ||
        (item.food.restrictedItemType === 'TOBACCO' && !userSummary.canPurchaseTobacco)
      ) {
        warnings.push({
          type: 'AGE_RESTRICTION',
          message: `You must be 21+ to purchase ${item.food.title}`,
          itemId: item.food._id,
          action: 'REMOVE_ITEM'
        })
      }
    }
  }
  
  return {
    items: cartItems,
    ageVerification: userSummary,
    restrictedItems,
    warnings,
    canCheckout: warnings.length === 0
  }
}

module.exports = {
  checkAgeVerificationForItems,
  ageVerificationMiddleware,
  checkFoodItemRestriction,
  checkMultipleFoodItemRestrictions,
  getUserVerificationSummary,
  expressAgeVerificationMiddleware,
  addAgeVerificationWarnings
}