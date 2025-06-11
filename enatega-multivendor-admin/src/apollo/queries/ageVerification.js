import { gql } from '@apollo/client'

// Admin Age Verification Queries
export const GET_AGE_VERIFICATION_REVIEWS = gql`
  query GetAgeVerificationReviews($limit: Int, $offset: Int) {
    getAgeVerificationReviews(limit: $limit, offset: $offset) {
      _id
      user {
        _id
        name
        email
        avatar
        phone
        createdAt
      }
      document {
        _id
        status
        submittedAt
        reviewedAt
        verifiedAt
        rejectionReason
        dateOfBirth
        restrictedItemTypes
        document {
          url
          thumbnailUrl
          documentType
          originalName
          fileSize
          mimeType
        }
        verifiedBy {
          _id
          name
          email
        }
      }
      submittedAt
      priority
    }
  }
`

export const GET_AGE_VERIFICATION_ANALYTICS = gql`
  query GetAgeVerificationAnalytics($startDate: Date, $endDate: Date) {
    ageVerificationAnalytics(startDate: $startDate, endDate: $endDate) {
      totalSubmissions
      pendingReviews
      approvedCount
      rejectedCount
      averageReviewTimeHours
      restrictedItemsPurchased
      complianceRate
      submissionsByDay {
        date
        count
      }
      reviewsByAdmin {
        adminId
        adminName
        reviewCount
        averageReviewTime
      }
      rejectionReasons {
        reason
        count
      }
      documentTypes {
        type
        count
        approvalRate
      }
      ageDistribution {
        ageRange
        count
      }
    }
  }
`

export const GET_AGE_VERIFICATION_STATS = gql`
  query GetAgeVerificationStats {
    ageVerificationStats {
      total
      pending
      approved
      rejected
      todaySubmissions
      weeklySubmissions
      monthlySubmissions
      averageProcessingTime
      oldestPendingDays
      complianceScore
    }
  }
`

// Admin Age Verification Mutations
export const REVIEW_AGE_VERIFICATION = gql`
  mutation ReviewAgeVerification($input: AgeVerificationReviewInput!) {
    reviewAgeVerification(input: $input) {
      success
      message
      document {
        _id
        status
        reviewedAt
        verifiedAt
        rejectionReason
        verifiedBy {
          _id
          name
        }
      }
      verificationInfo {
        isVerified
        status
        canPurchaseRestricted
        restrictedItemTypes
        age
      }
    }
  }
`

export const BULK_REVIEW_AGE_VERIFICATIONS = gql`
  mutation BulkReviewAgeVerifications($reviews: [AgeVerificationReviewInput!]!) {
    bulkReviewAgeVerifications(reviews: $reviews) {
      successCount
      failureCount
      results {
        userId
        success
        message
        error
      }
    }
  }
`

export const DELETE_AGE_VERIFICATION_ADMIN = gql`
  mutation DeleteAgeVerificationAdmin($userId: ID!, $reason: String!) {
    deleteAgeVerificationAdmin(userId: $userId, reason: $reason) {
      success
      message
    }
  }
`

export const UPDATE_AGE_VERIFICATION_SETTINGS = gql`
  mutation UpdateAgeVerificationSettings($settings: AgeVerificationSettingsInput!) {
    updateAgeVerificationSettings(settings: $settings) {
      success
      message
      settings {
        enabled
        minimumAgeTobacco
        minimumAgeAlcohol
        verificationExpiryMonths
        maxUploadSizeMB
        allowedDocumentTypes
        autoCleanupDays
        reminderDays
      }
    }
  }
`

// Age Verification Subscriptions for Admin
export const NEW_AGE_VERIFICATION_SUBMISSION = gql`
  subscription NewAgeVerificationSubmission {
    newAgeVerificationSubmission {
      _id
      user {
        _id
        name
        email
        avatar
      }
      document {
        _id
        status
        submittedAt
        document {
          documentType
          fileSize
        }
      }
      submittedAt
      priority
    }
  }
`

export const AGE_VERIFICATION_REVIEWED = gql`
  subscription AgeVerificationReviewed {
    ageVerificationReviewed {
      _id
      status
      reviewedAt
      verifiedAt
      rejectionReason
      user {
        _id
        name
        email
      }
      verifiedBy {
        _id
        name
      }
    }
  }
`

// User Management with Age Verification
export const GET_USERS_WITH_AGE_VERIFICATION = gql`
  query GetUsersWithAgeVerification($limit: Int, $offset: Int, $filter: UserFilterInput) {
    users(limit: $limit, offset: $offset, filter: $filter) {
      _id
      name
      email
      phone
      avatar
      createdAt
      isActive
      totalOrders
      totalSpent
      ageVerification {
        isVerified
        status
        canPurchaseRestricted
        age
        verificationExpiryDate
        submittedAt
        reviewedAt
      }
    }
    userCount(filter: $filter)
  }
`

export const GET_USER_AGE_VERIFICATION_HISTORY = gql`
  query GetUserAgeVerificationHistory($userId: ID!) {
    userAgeVerificationHistory(userId: $userId) {
      _id
      status
      submittedAt
      reviewedAt
      verifiedAt
      rejectionReason
      dateOfBirth
      document {
        documentType
        originalName
        fileSize
        url
      }
      verifiedBy {
        _id
        name
      }
      auditLog {
        action
        timestamp
        adminId
        adminName
        details
      }
    }
  }
`

// Restricted Items Management
export const GET_RESTRICTED_ITEMS = gql`
  query GetRestrictedItems($restaurantId: ID) {
    restrictedItems(restaurantId: $restaurantId) {
      _id
      title
      description
      price
      image
      restaurant {
        _id
        name
      }
      category {
        _id
        title
      }
      isRestrictedItem
      restrictedItemType
      minimumAge
      restrictionNote
      orderCount
      isActive
    }
  }
`

export const UPDATE_FOOD_RESTRICTION = gql`
  mutation UpdateFoodRestriction($foodId: ID!, $restriction: FoodRestrictionInput!) {
    updateFoodRestriction(foodId: $foodId, restriction: $restriction) {
      _id
      title
      isRestrictedItem
      restrictedItemType
      minimumAge
      restrictionNote
    }
  }
`

export const BULK_UPDATE_FOOD_RESTRICTIONS = gql`
  mutation BulkUpdateFoodRestrictions($updates: [FoodRestrictionUpdateInput!]!) {
    bulkUpdateFoodRestrictions(updates: $updates) {
      successCount
      failureCount
      results {
        foodId
        success
        message
      }
    }
  }
`

// Compliance and Reporting
export const GET_COMPLIANCE_REPORT = gql`
  query GetComplianceReport($startDate: Date!, $endDate: Date!, $restaurantId: ID) {
    complianceReport(startDate: $startDate, endDate: $endDate, restaurantId: $restaurantId) {
      totalRestrictedOrders
      verifiedPurchases
      blockedPurchases
      complianceRate
      violationCount
      averageVerificationTime
      topRestrictedItems {
        itemId
        itemName
        orderCount
        blockedCount
      }
      ageDistribution {
        ageRange
        orderCount
        verificationRate
      }
      dailyStats {
        date
        restrictedOrders
        verifiedPurchases
        blockedPurchases
      }
      violations {
        orderId
        userId
        userName
        itemName
        reason
        timestamp
        resolved
      }
    }
  }
`

export const EXPORT_COMPLIANCE_DATA = gql`
  mutation ExportComplianceData($startDate: Date!, $endDate: Date!, $format: String!) {
    exportComplianceData(startDate: $startDate, endDate: $endDate, format: $format) {
      success
      downloadUrl
      fileName
      expiresAt
    }
  }
`

// System Settings
export const GET_AGE_VERIFICATION_SETTINGS = gql`
  query GetAgeVerificationSettings {
    ageVerificationSettings {
      enabled
      minimumAgeTobacco
      minimumAgeAlcohol
      verificationExpiryMonths
      maxUploadSizeMB
      allowedDocumentTypes
      autoCleanupDays
      reminderDays
      requireReviewForAll
      allowSelfVerification
      notificationSettings {
        emailAdmins
        slackWebhook
        pushNotifications
      }
    }
  }
`

// Audit Logs
export const GET_AGE_VERIFICATION_AUDIT_LOGS = gql`
  query GetAgeVerificationAuditLogs($limit: Int, $offset: Int, $userId: ID, $adminId: ID) {
    ageVerificationAuditLogs(limit: $limit, offset: $offset, userId: $userId, adminId: $adminId) {
      _id
      action
      timestamp
      userId
      userName
      adminId
      adminName
      details
      ipAddress
      userAgent
      metadata
    }
  }
`

// Performance Metrics
export const GET_ADMIN_PERFORMANCE_METRICS = gql`
  query GetAdminPerformanceMetrics($adminId: ID, $startDate: Date, $endDate: Date) {
    adminPerformanceMetrics(adminId: $adminId, startDate: $startDate, endDate: $endDate) {
      adminId
      adminName
      totalReviews
      averageReviewTime
      approvalRate
      rejectionRate
      dailyReviews {
        date
        reviewCount
        averageTime
      }
      reviewAccuracy
      feedbackScore
    }
  }
`