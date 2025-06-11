const ageVerificationTypeDefs = `
  enum AgeVerificationStatus {
    PENDING
    VERIFIED
    REJECTED
    EXPIRED
  }

  enum RestrictedItemType {
    TOBACCO
    ALCOHOL
    BOTH
  }

  type AgeVerificationDocument {
    _id: ID!
    url: String!
    thumbnailUrl: String
    uploadedAt: String!
    status: AgeVerificationStatus!
    verifiedAt: String
    expiryDate: String
    rejectionReason: String
    documentType: String!
    fileSize: Int!
    mimeType: String!
    verifiedBy: ID
  }

  type AgeVerificationInfo {
    isVerified: Boolean!
    status: AgeVerificationStatus!
    document: AgeVerificationDocument
    canPurchaseRestricted: Boolean!
    restrictedItemTypes: String
    verificationExpiryDate: String
    dateOfBirth: String
    age: Int
  }

  input AgeVerificationUploadInput {
    documentType: String!
    dateOfBirth: String!
  }

  type AgeVerificationUploadResponse {
    success: Boolean!
    message: String!
    document: AgeVerificationDocument
    verificationInfo: AgeVerificationInfo
  }

  type AgeVerificationReview {
    _id: ID!
    user: User!
    document: AgeVerificationDocument!
    submittedAt: String!
    priority: Int!
  }

  input AgeVerificationReviewInput {
    userId: ID!
    status: AgeVerificationStatus!
    rejectionReason: String
    dateOfBirth: String
  }

  extend type User {
    ageVerification: AgeVerificationInfo
  }

  extend type Query {
    getAgeVerificationStatus: AgeVerificationInfo
    getAgeVerificationReviews(limit: Int, offset: Int): String
    canPurchaseRestrictedItem(itemType: RestrictedItemType!): Boolean!
  }

  extend type Mutation {
    uploadAgeVerificationDocument(
      file: String!
      input: AgeVerificationUploadInput!
    ): AgeVerificationUploadResponse!
    
    reviewAgeVerification(
      input: AgeVerificationReviewInput!
    ): AgeVerificationUploadResponse!
    
    deleteAgeVerificationDocument: Boolean!
  }

  extend type Subscription {
    ageVerificationStatusUpdated: AgeVerificationInfo!
    newAgeVerificationSubmission: AgeVerificationReview!
  }
`

module.exports = ageVerificationTypeDefs