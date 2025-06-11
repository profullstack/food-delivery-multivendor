const moment = require('moment')

/**
 * Validate if a date of birth meets minimum age requirements
 * @param {Date} dateOfBirth - The date of birth to validate
 * @param {number} minimumAge - Minimum age required (default: 18)
 * @returns {boolean} - True if age is valid
 */
const validateAge = (dateOfBirth, minimumAge = 18) => {
  if (!dateOfBirth || !(dateOfBirth instanceof Date)) {
    return false
  }
  
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  
  // Check if date is in the future
  if (birthDate > today) {
    return false
  }
  
  // Check if date is too far in the past (reasonable limit: 120 years)
  const maxAge = 120
  const minBirthDate = new Date()
  minBirthDate.setFullYear(today.getFullYear() - maxAge)
  
  if (birthDate < minBirthDate) {
    return false
  }
  
  // Calculate age
  const age = moment().diff(moment(birthDate), 'years')
  
  return age >= minimumAge
}

/**
 * Calculate exact age from date of birth
 * @param {Date} dateOfBirth - The date of birth
 * @returns {number} - Age in years
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth || !(dateOfBirth instanceof Date)) {
    return null
  }
  
  return moment().diff(moment(dateOfBirth), 'years')
}

/**
 * Validate document type
 * @param {string} documentType - The document type to validate
 * @returns {boolean} - True if document type is valid
 */
const validateDocumentType = (documentType) => {
  const validTypes = [
    'DRIVERS_LICENSE',
    'PASSPORT',
    'NATIONAL_ID',
    'STATE_ID'
  ]
  
  return validTypes.includes(documentType)
}

/**
 * Validate if user can purchase restricted items based on age
 * @param {Date} dateOfBirth - User's date of birth
 * @param {string} itemType - Type of restricted item
 * @returns {boolean} - True if user can purchase
 */
const canPurchaseRestrictedItem = (dateOfBirth, itemType) => {
  if (!dateOfBirth || !(dateOfBirth instanceof Date)) {
    return false
  }
  
  const age = calculateAge(dateOfBirth)
  
  switch (itemType) {
    case 'TOBACCO':
    case 'ALCOHOL':
    case 'BOTH':
      return age >= 21 // US federal requirement
    default:
      return age >= 18 // General adult age
  }
}

/**
 * Validate file upload for age verification documents
 * @param {Object} file - File object with mimetype and size
 * @returns {Object} - Validation result with isValid and errors
 */
const validateAgeVerificationFile = (file) => {
  const errors = []
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  
  if (!file) {
    errors.push('File is required')
    return { isValid: false, errors }
  }
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Only JPEG and PNG files are allowed')
  }
  
  // Check file size
  if (file.size && file.size > maxSize) {
    errors.push('File size must be less than 5MB')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate age verification input data
 * @param {Object} input - Input data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validateAgeVerificationInput = (input) => {
  const errors = []
  
  if (!input) {
    errors.push('Input data is required')
    return { isValid: false, errors }
  }
  
  const { documentType, dateOfBirth } = input
  
  // Validate document type
  if (!documentType) {
    errors.push('Document type is required')
  } else if (!validateDocumentType(documentType)) {
    errors.push('Invalid document type')
  }
  
  // Validate date of birth
  if (!dateOfBirth) {
    errors.push('Date of birth is required')
  } else {
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid date of birth format')
    } else if (!validateAge(birthDate)) {
      errors.push('User must be at least 18 years old')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate review input for admin
 * @param {Object} input - Review input data
 * @returns {Object} - Validation result with isValid and errors
 */
const validateReviewInput = (input) => {
  const errors = []
  
  if (!input) {
    errors.push('Review input is required')
    return { isValid: false, errors }
  }
  
  const { userId, status, rejectionReason, dateOfBirth } = input
  
  // Validate user ID
  if (!userId) {
    errors.push('User ID is required')
  }
  
  // Validate status
  const validStatuses = ['VERIFIED', 'REJECTED']
  if (!status) {
    errors.push('Status is required')
  } else if (!validStatuses.includes(status)) {
    errors.push('Invalid status. Must be VERIFIED or REJECTED')
  }
  
  // Validate rejection reason if status is REJECTED
  if (status === 'REJECTED' && !rejectionReason) {
    errors.push('Rejection reason is required when rejecting verification')
  }
  
  // Validate date of birth if provided
  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid date of birth format')
    } else if (!validateAge(birthDate)) {
      errors.push('Date of birth indicates user is under 18')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if verification document is expired
 * @param {Date} verifiedAt - Date when document was verified
 * @param {number} expiryMonths - Number of months until expiry (default: 24)
 * @returns {boolean} - True if expired
 */
const isVerificationExpired = (verifiedAt, expiryMonths = 24) => {
  if (!verifiedAt || !(verifiedAt instanceof Date)) {
    return true
  }
  
  const expiryDate = moment(verifiedAt).add(expiryMonths, 'months')
  return moment().isAfter(expiryDate)
}

/**
 * Get verification expiry date
 * @param {Date} verifiedAt - Date when document was verified
 * @param {number} expiryMonths - Number of months until expiry (default: 24)
 * @returns {Date|null} - Expiry date or null if not verified
 */
const getVerificationExpiryDate = (verifiedAt, expiryMonths = 24) => {
  if (!verifiedAt || !(verifiedAt instanceof Date)) {
    return null
  }
  
  return moment(verifiedAt).add(expiryMonths, 'months').toDate()
}

module.exports = {
  validateAge,
  calculateAge,
  validateDocumentType,
  canPurchaseRestrictedItem,
  validateAgeVerificationFile,
  validateAgeVerificationInput,
  validateReviewInput,
  isVerificationExpired,
  getVerificationExpiryDate
}