import { gql } from '@apollo/client'

// Age Verification Mutations
export const UPLOAD_AGE_VERIFICATION = gql`
  mutation UploadAgeVerificationDocument($file: Upload!, $input: AgeVerificationInput!) {
    uploadAgeVerificationDocument(file: $file, input: $input) {
      success
      message
      document {
        _id
        status
        submittedAt
        document {
          url
          thumbnailUrl
          documentType
          fileSize
        }
      }
      verificationInfo {
        isVerified
        status
        canPurchaseRestricted
        restrictedItemTypes
        verificationExpiryDate
        dateOfBirth
        age
      }
    }
  }
`

export const DELETE_AGE_VERIFICATION = gql`
  mutation DeleteAgeVerificationDocument {
    deleteAgeVerificationDocument
  }
`

// Age Verification Queries
export const GET_AGE_VERIFICATION_STATUS = gql`
  query GetAgeVerificationStatus {
    getAgeVerificationStatus {
      isVerified
      status
      document {
        _id
        status
        submittedAt
        reviewedAt
        verifiedAt
        rejectionReason
        document {
          url
          thumbnailUrl
          documentType
          originalName
          fileSize
        }
      }
      canPurchaseRestricted
      restrictedItemTypes
      verificationExpiryDate
      dateOfBirth
      age
    }
  }
`

export const CAN_PURCHASE_RESTRICTED_ITEM = gql`
  query CanPurchaseRestrictedItem($itemType: RestrictedItemType!) {
    canPurchaseRestrictedItem(itemType: $itemType)
  }
`

// Age Verification Subscriptions
export const AGE_VERIFICATION_STATUS_UPDATED = gql`
  subscription AgeVerificationStatusUpdated {
    ageVerificationStatusUpdated {
      isVerified
      status
      document {
        _id
        status
        reviewedAt
        verifiedAt
        rejectionReason
      }
      canPurchaseRestricted
      restrictedItemTypes
      verificationExpiryDate
      age
    }
  }
`

// Food/Cart related queries with age verification
export const GET_CART_WITH_AGE_VERIFICATION = gql`
  query GetCartWithAgeVerification {
    cart {
      _id
      items {
        _id
        food {
          _id
          title
          price
          image
          isRestrictedItem
          restrictedItemType
          minimumAge
          restrictionNote
        }
        quantity
        variation
        addons {
          _id
          title
          price
        }
      }
      total
      deliveryCharges
      tax
      ageVerificationWarnings {
        type
        message
        itemId
        action
      }
      restrictedItems {
        itemId
        itemName
        itemType
        quantity
      }
      canCheckout
    }
    getAgeVerificationStatus {
      isVerified
      status
      canPurchaseRestricted
      restrictedItemTypes
      age
    }
  }
`

export const CHECK_RESTRICTED_ITEMS_IN_CART = gql`
  query CheckRestrictedItemsInCart($foodIds: [ID!]!) {
    checkRestrictedItemsInCart(foodIds: $foodIds) {
      foodId
      title
      isRestricted
      restrictedItemType
      minimumAge
      canPurchase
      userAge
      verificationRequired
    }
  }
`

// Order mutations with age verification
export const CREATE_ORDER_WITH_AGE_VERIFICATION = gql`
  mutation CreateOrder($orderInput: OrderInput!) {
    createOrder(orderInput: $orderInput) {
      _id
      orderId
      orderStatus
      createdAt
      items {
        _id
        food {
          _id
          title
          isRestrictedItem
          restrictedItemType
        }
        quantity
      }
      total
      ageVerificationChecked
      restrictedItemsVerified
    }
  }
`

// Food queries with restriction info
export const GET_FOOD_WITH_RESTRICTIONS = gql`
  query GetFoodWithRestrictions($id: ID!) {
    food(id: $id) {
      _id
      title
      description
      price
      discountPrice
      image
      category {
        _id
        title
      }
      restaurant {
        _id
        name
      }
      isRestrictedItem
      restrictedItemType
      minimumAge
      restrictionNote
      ageVerificationDisplay {
        required
        minimumAge
        itemType
        note
      }
      variations {
        _id
        title
        price
        discountPrice
      }
      addons {
        _id
        title
        description
        price
      }
      isActive
      isAvailable
    }
    getAgeVerificationStatus {
      isVerified
      canPurchaseRestricted
      age
    }
  }
`

export const GET_RESTAURANT_FOODS_WITH_RESTRICTIONS = gql`
  query GetRestaurantFoodsWithRestrictions($restaurantId: ID!, $categoryId: ID) {
    restaurantFoods(restaurantId: $restaurantId, categoryId: $categoryId) {
      _id
      title
      description
      price
      discountPrice
      image
      category {
        _id
        title
      }
      isRestrictedItem
      restrictedItemType
      minimumAge
      restrictionNote
      isActive
      isAvailable
      variations {
        _id
        title
        price
      }
    }
    getAgeVerificationStatus {
      isVerified
      canPurchaseRestricted
      restrictedItemTypes
      age
    }
  }
`

// User profile with age verification
export const GET_USER_PROFILE_WITH_AGE_VERIFICATION = gql`
  query GetUserProfileWithAgeVerification {
    profile {
      _id
      name
      email
      phone
      avatar
      addresses {
        _id
        title
        address
        details
        location {
          latitude
          longitude
        }
        isDefault
      }
      notificationSettings {
        orderUpdates
        promotions
        ageVerificationUpdates
        emailNotifications
      }
    }
    getAgeVerificationStatus {
      isVerified
      status
      document {
        _id
        submittedAt
        reviewedAt
        verifiedAt
        rejectionReason
        document {
          documentType
          originalName
        }
      }
      canPurchaseRestricted
      restrictedItemTypes
      verificationExpiryDate
      dateOfBirth
      age
    }
  }
`

// Notification preferences update
export const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences($preferences: NotificationPreferencesInput!) {
    updateNotificationPreferences(preferences: $preferences) {
      _id
      notificationSettings {
        orderUpdates
        promotions
        ageVerificationUpdates
        emailNotifications
        smsNotifications
      }
    }
  }
`

// Age verification analytics (for admin/debugging)
export const GET_AGE_VERIFICATION_ANALYTICS = gql`
  query GetAgeVerificationAnalytics {
    ageVerificationAnalytics {
      totalSubmissions
      pendingReviews
      approvedCount
      rejectedCount
      averageReviewTime
      restrictedItemsPurchased
      complianceRate
    }
  }
`