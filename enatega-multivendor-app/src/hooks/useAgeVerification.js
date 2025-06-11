import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useSubscription } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'

import {
  GET_AGE_VERIFICATION_STATUS,
  CAN_PURCHASE_RESTRICTED_ITEM,
  CHECK_RESTRICTED_ITEMS_IN_CART,
  AGE_VERIFICATION_STATUS_UPDATED
} from '../apollo/mutations/ageVerification'
import { FlashMessage } from '../utils/FlashMessage'

/**
 * Custom hook for managing age verification state and operations
 * @param {Object} options - Configuration options
 * @returns {Object} Age verification state and methods
 */
export const useAgeVerification = (options = {}) => {
  const {
    autoRefetch = true,
    showNotifications = true,
    redirectOnVerification = false
  } = options

  const navigation = useNavigation()
  const { t } = useTranslation()
  
  const [isCheckingRestrictions, setIsCheckingRestrictions] = useState(false)
  const [restrictionWarnings, setRestrictionWarnings] = useState([])

  // Query current verification status
  const {
    data: verificationData,
    loading: verificationLoading,
    error: verificationError,
    refetch: refetchVerification
  } = useQuery(GET_AGE_VERIFICATION_STATUS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true
  })

  const verificationStatus = verificationData?.getAgeVerificationStatus

  // Subscribe to verification status updates
  useSubscription(AGE_VERIFICATION_STATUS_UPDATED, {
    skip: !autoRefetch,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data && showNotifications) {
        const updatedStatus = subscriptionData.data.ageVerificationStatusUpdated
        handleStatusUpdate(updatedStatus)
      }
    }
  })

  // Handle status updates from subscription
  const handleStatusUpdate = useCallback((updatedStatus) => {
    if (updatedStatus.status === 'VERIFIED') {
      FlashMessage({
        message: t('ageVerificationApproved'),
        description: t('youCanNowPurchaseRestrictedItems'),
        type: 'success',
        duration: 5000
      })
      
      if (redirectOnVerification) {
        navigation.goBack()
      }
    } else if (updatedStatus.status === 'REJECTED') {
      FlashMessage({
        message: t('ageVerificationRejected'),
        description: t('pleaseUploadNewDocument'),
        type: 'warning',
        duration: 5000
      })
    }
    
    // Refetch verification status
    refetchVerification()
  }, [t, showNotifications, redirectOnVerification, navigation, refetchVerification])

  /**
   * Check if user can purchase a specific restricted item
   * @param {string} itemType - Type of restricted item (TOBACCO, ALCOHOL, BOTH)
   * @returns {Promise<boolean>} Whether user can purchase the item
   */
  const canPurchaseRestrictedItem = useCallback(async (itemType) => {
    if (!verificationStatus) return false
    
    if (!verificationStatus.isVerified) return false
    
    if (!verificationStatus.canPurchaseRestricted) return false
    
    // Check if user can purchase this specific type
    return verificationStatus.restrictedItemTypes.includes(itemType) ||
           verificationStatus.restrictedItemTypes.includes('BOTH')
  }, [verificationStatus])

  /**
   * Check restrictions for multiple items in cart
   * @param {Array} cartItems - Array of cart items with food details
   * @returns {Promise<Object>} Restriction analysis result
   */
  const checkCartRestrictions = useCallback(async (cartItems) => {
    setIsCheckingRestrictions(true)
    
    try {
      const restrictedItems = []
      const warnings = []
      let canCheckout = true

      for (const item of cartItems) {
        if (item.food?.isRestrictedItem) {
          const restrictedItem = {
            itemId: item.food._id,
            itemName: item.food.title,
            itemType: item.food.restrictedItemType,
            quantity: item.quantity,
            minimumAge: item.food.minimumAge || 21
          }
          
          restrictedItems.push(restrictedItem)

          // Check if user can purchase this item
          const canPurchase = await canPurchaseRestrictedItem(item.food.restrictedItemType)
          
          if (!canPurchase) {
            canCheckout = false
            
            if (!verificationStatus?.isVerified) {
              warnings.push({
                type: 'AGE_VERIFICATION_REQUIRED',
                message: t('ageVerificationRequiredFor', { itemName: item.food.title }),
                itemId: item.food._id,
                action: 'UPLOAD_ID'
              })
            } else if (verificationStatus?.status === 'PENDING') {
              warnings.push({
                type: 'VERIFICATION_PENDING',
                message: t('verificationPendingFor', { itemName: item.food.title }),
                itemId: item.food._id,
                action: 'WAIT'
              })
            } else if (verificationStatus?.status === 'REJECTED') {
              warnings.push({
                type: 'VERIFICATION_REJECTED',
                message: t('verificationRejectedFor', { itemName: item.food.title }),
                itemId: item.food._id,
                action: 'UPLOAD_ID'
              })
            } else {
              warnings.push({
                type: 'AGE_RESTRICTION',
                message: t('ageRestrictionFor', { 
                  itemName: item.food.title,
                  minimumAge: restrictedItem.minimumAge 
                }),
                itemId: item.food._id,
                action: 'REMOVE_ITEM'
              })
            }
          }
        }
      }

      setRestrictionWarnings(warnings)
      
      return {
        restrictedItems,
        warnings,
        canCheckout,
        verificationStatus
      }
    } catch (error) {
      console.error('Error checking cart restrictions:', error)
      return {
        restrictedItems: [],
        warnings: [],
        canCheckout: false,
        verificationStatus,
        error: error.message
      }
    } finally {
      setIsCheckingRestrictions(false)
    }
  }, [verificationStatus, canPurchaseRestrictedItem, t])

  /**
   * Navigate to age verification screen
   * @param {Object} params - Navigation parameters
   */
  const navigateToVerification = useCallback((params = {}) => {
    navigation.navigate('AgeVerification', {
      showBackButton: true,
      ...params
    })
  }, [navigation])

  /**
   * Show age verification required alert
   * @param {string} itemName - Name of restricted item
   * @param {Function} onVerify - Callback when user chooses to verify
   */
  const showVerificationRequiredAlert = useCallback((itemName, onVerify) => {
    Alert.alert(
      t('ageVerificationRequired'),
      t('ageVerificationRequiredMessage', { itemName }),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('verifyAge'), 
          onPress: onVerify || (() => navigateToVerification({ restrictedItem: { name: itemName } }))
        }
      ]
    )
  }, [t, navigateToVerification])

  /**
   * Check if user needs age verification for checkout
   * @param {Array} cartItems - Cart items to check
   * @returns {Promise<boolean>} Whether checkout should be blocked
   */
  const shouldBlockCheckout = useCallback(async (cartItems) => {
    const result = await checkCartRestrictions(cartItems)
    return !result.canCheckout
  }, [checkCartRestrictions])

  /**
   * Get age verification summary for display
   * @returns {Object} Verification summary
   */
  const getVerificationSummary = useCallback(() => {
    if (!verificationStatus) {
      return {
        isVerified: false,
        status: 'NONE',
        canPurchaseRestricted: false,
        message: t('noVerificationFound'),
        actionRequired: 'UPLOAD_DOCUMENT'
      }
    }

    const summary = {
      isVerified: verificationStatus.isVerified,
      status: verificationStatus.status,
      canPurchaseRestricted: verificationStatus.canPurchaseRestricted,
      age: verificationStatus.age,
      expiryDate: verificationStatus.verificationExpiryDate
    }

    switch (verificationStatus.status) {
      case 'VERIFIED':
        summary.message = t('ageVerifiedMessage', { age: verificationStatus.age })
        summary.actionRequired = null
        break
      case 'PENDING':
        summary.message = t('verificationPendingMessage')
        summary.actionRequired = 'WAIT'
        break
      case 'REJECTED':
        summary.message = t('verificationRejectedMessage')
        summary.actionRequired = 'UPLOAD_NEW_DOCUMENT'
        break
      default:
        summary.message = t('noVerificationMessage')
        summary.actionRequired = 'UPLOAD_DOCUMENT'
    }

    return summary
  }, [verificationStatus, t])

  /**
   * Refresh verification status
   */
  const refreshVerificationStatus = useCallback(() => {
    refetchVerification()
  }, [refetchVerification])

  return {
    // Status
    verificationStatus,
    verificationLoading,
    verificationError,
    isCheckingRestrictions,
    restrictionWarnings,
    
    // Methods
    canPurchaseRestrictedItem,
    checkCartRestrictions,
    navigateToVerification,
    showVerificationRequiredAlert,
    shouldBlockCheckout,
    getVerificationSummary,
    refreshVerificationStatus,
    
    // Computed values
    isVerified: verificationStatus?.isVerified || false,
    canPurchaseRestricted: verificationStatus?.canPurchaseRestricted || false,
    verificationAge: verificationStatus?.age || null,
    verificationExpiryDate: verificationStatus?.verificationExpiryDate || null,
    
    // Status checks
    isPending: verificationStatus?.status === 'PENDING',
    isRejected: verificationStatus?.status === 'REJECTED',
    hasVerification: !!verificationStatus,
    needsVerification: !verificationStatus?.isVerified
  }
}

export default useAgeVerification