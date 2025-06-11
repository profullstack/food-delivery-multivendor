import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Alert
} from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { useQuery, useSubscription } from '@apollo/client'
import { useTranslation } from 'react-i18next'

import AgeVerificationUpload from '../../components/AgeVerification/AgeVerificationUpload'
import { 
  GET_AGE_VERIFICATION_STATUS,
  AGE_VERIFICATION_STATUS_UPDATED 
} from '../../apollo/mutations/ageVerification'
import { colors, scale } from '../../utils'
import TextDefault from '../../components/Text/TextDefault/TextDefault'
import { FlashMessage } from '../../utils/FlashMessage'
import Spinner from '../../components/Spinner/Spinner'
import { HeaderBackButton } from '@react-navigation/elements'

const AgeVerificationScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)

  // Get parameters from navigation
  const { 
    redirectTo = null, 
    restrictedItem = null,
    showBackButton = true,
    onSuccess = null 
  } = route.params || {}

  // Query current verification status
  const { data, loading, error, refetch } = useQuery(GET_AGE_VERIFICATION_STATUS, {
    fetchPolicy: 'cache-and-network',
    onCompleted: () => setIsLoading(false),
    onError: () => setIsLoading(false)
  })

  // Subscribe to verification status updates
  useSubscription(AGE_VERIFICATION_STATUS_UPDATED, {
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data) {
        const updatedStatus = subscriptionData.data.ageVerificationStatusUpdated
        
        // Show notification based on status
        if (updatedStatus.status === 'VERIFIED') {
          FlashMessage({
            message: t('ageVerificationApproved'),
            description: t('ageVerificationApprovedMessage'),
            type: 'success',
            duration: 5000
          })
          
          // Handle success callback or navigation
          handleVerificationSuccess(updatedStatus)
        } else if (updatedStatus.status === 'REJECTED') {
          FlashMessage({
            message: t('ageVerificationRejected'),
            description: t('ageVerificationRejectedMessage'),
            type: 'warning',
            duration: 5000
          })
        }
        
        // Refetch to update UI
        refetch()
      }
    }
  })

  // Handle back button behavior
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!showBackButton) {
          // If back button is disabled, show alert
          Alert.alert(
            t('ageVerificationRequired'),
            t('ageVerificationRequiredMessage'),
            [
              { text: t('ok') }
            ]
          )
          return true // Prevent default back action
        }
        return false // Allow default back action
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => subscription?.remove()
    }, [showBackButton, t])
  )

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      title: t('ageVerification'),
      headerLeft: showBackButton ? 
        () => (
          <HeaderBackButton
            onPress={() => navigation.goBack()}
            tintColor={colors.fontMainColor}
          />
        ) : 
        () => null,
      headerStyle: {
        backgroundColor: colors.headerBackground
      },
      headerTintColor: colors.fontMainColor,
      headerTitleStyle: {
        fontWeight: 'bold'
      }
    })
  }, [navigation, showBackButton, t])

  const handleVerificationSuccess = (verificationInfo) => {
    // Call success callback if provided
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(verificationInfo)
    }

    // Navigate to redirect destination or go back
    if (redirectTo) {
      navigation.navigate(redirectTo)
    } else if (showBackButton) {
      navigation.goBack()
    }
  }

  const handleUploadSuccess = (verificationInfo) => {
    if (verificationInfo.isVerified) {
      // If immediately verified (unlikely but possible)
      handleVerificationSuccess(verificationInfo)
    } else {
      // Show pending message
      FlashMessage({
        message: t('documentUploadedSuccessfully'),
        description: t('verificationPendingMessage'),
        type: 'success',
        duration: 4000
      })
    }
  }

  if (loading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          backgroundColor={colors.headerBackground} 
          barStyle="light-content" 
        />
        <View style={styles.loadingContainer}>
          <Spinner />
          <TextDefault H4 style={styles.loadingText}>
            {t('loadingVerificationStatus')}
          </TextDefault>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          backgroundColor={colors.headerBackground} 
          barStyle="light-content" 
        />
        <View style={styles.errorContainer}>
          <TextDefault H3 bold style={styles.errorTitle}>
            {t('error')}
          </TextDefault>
          <TextDefault H5 style={styles.errorMessage}>
            {error.message || t('failedToLoadVerificationStatus')}
          </TextDefault>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        backgroundColor={colors.headerBackground} 
        barStyle="light-content" 
      />
      
      {/* Restricted Item Info */}
      {restrictedItem && (
        <View style={styles.restrictedItemBanner}>
          <TextDefault H5 bold style={styles.bannerTitle}>
            {t('restrictedItemPurchase')}
          </TextDefault>
          <TextDefault H6 style={styles.bannerMessage}>
            {t('restrictedItemMessage', { 
              itemName: restrictedItem.name,
              itemType: restrictedItem.type?.toLowerCase() 
            })}
          </TextDefault>
        </View>
      )}

      <AgeVerificationUpload
        navigation={navigation}
        onSuccess={handleUploadSuccess}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.themeBackground
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(32)
  },
  loadingText: {
    color: colors.fontMainColor,
    marginTop: scale(16),
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(32)
  },
  errorTitle: {
    color: colors.red,
    marginBottom: scale(16),
    textAlign: 'center'
  },
  errorMessage: {
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 22
  },
  restrictedItemBanner: {
    backgroundColor: colors.orange + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
    padding: scale(16),
    marginHorizontal: scale(16),
    marginTop: scale(8),
    borderRadius: scale(8)
  },
  bannerTitle: {
    color: colors.orange,
    marginBottom: scale(4)
  },
  bannerMessage: {
    color: colors.fontMainColor,
    lineHeight: 20
  }
})

export default AgeVerificationScreen