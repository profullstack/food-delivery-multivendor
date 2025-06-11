import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'

import { colors, scale, verticalScale } from '../../utils'
import TextDefault from '../Text/TextDefault/TextDefault'

const AgeVerificationWarning = ({ 
  warnings = [], 
  restrictedItems = [], 
  verificationStatus = null,
  onRemoveItem,
  onNavigateToVerification 
}) => {
  const { t } = useTranslation()
  const navigation = useNavigation()

  if (!warnings.length && !restrictedItems.length) {
    return null
  }

  const handleVerificationAction = () => {
    if (onNavigateToVerification) {
      onNavigateToVerification()
    } else {
      navigation.navigate('AgeVerification')
    }
  }

  const handleRemoveItem = (itemId) => {
    Alert.alert(
      t('removeRestrictedItem'),
      t('removeRestrictedItemMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'), 
          style: 'destructive',
          onPress: () => onRemoveItem && onRemoveItem(itemId)
        }
      ]
    )
  }

  const getWarningIcon = (type) => {
    switch (type) {
      case 'AGE_VERIFICATION_REQUIRED':
        return 'warning'
      case 'AGE_RESTRICTION':
        return 'block'
      default:
        return 'information-circle'
    }
  }

  const getWarningColor = (type) => {
    switch (type) {
      case 'AGE_VERIFICATION_REQUIRED':
        return colors.orange
      case 'AGE_RESTRICTION':
        return colors.red
      default:
        return colors.blue
    }
  }

  const renderVerificationStatus = () => {
    if (!verificationStatus) return null

    const { isVerified, status, age, canPurchaseRestricted } = verificationStatus

    if (isVerified && canPurchaseRestricted) {
      return (
        <View style={[styles.statusCard, styles.successCard]}>
          <View style={styles.statusHeader}>
            <Ionicons name="checkmark-circle" size={24} color={colors.green} />
            <TextDefault H5 bold style={[styles.statusTitle, { color: colors.green }]}>
              {t('ageVerified')}
            </TextDefault>
          </View>
          <TextDefault H6 style={styles.statusMessage}>
            {t('ageVerifiedCanPurchase', { age })}
          </TextDefault>
        </View>
      )
    }

    if (status === 'PENDING') {
      return (
        <View style={[styles.statusCard, styles.pendingCard]}>
          <View style={styles.statusHeader}>
            <MaterialIcons name="pending" size={24} color={colors.orange} />
            <TextDefault H5 bold style={[styles.statusTitle, { color: colors.orange }]}>
              {t('verificationPending')}
            </TextDefault>
          </View>
          <TextDefault H6 style={styles.statusMessage}>
            {t('verificationPendingCartMessage')}
          </TextDefault>
        </View>
      )
    }

    if (status === 'REJECTED') {
      return (
        <View style={[styles.statusCard, styles.errorCard]}>
          <View style={styles.statusHeader}>
            <Ionicons name="close-circle" size={24} color={colors.red} />
            <TextDefault H5 bold style={[styles.statusTitle, { color: colors.red }]}>
              {t('verificationRejected')}
            </TextDefault>
          </View>
          <TextDefault H6 style={styles.statusMessage}>
            {t('verificationRejectedCartMessage')}
          </TextDefault>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleVerificationAction}
          >
            <TextDefault H6 bold style={styles.actionButtonText}>
              {t('uploadNewDocument')}
            </TextDefault>
          </TouchableOpacity>
        </View>
      )
    }

    return null
  }

  const renderRestrictedItems = () => {
    if (!restrictedItems.length) return null

    return (
      <View style={styles.restrictedItemsContainer}>
        <TextDefault H5 bold style={styles.sectionTitle}>
          {t('restrictedItemsInCart')}
        </TextDefault>
        {restrictedItems.map((item, index) => (
          <View key={index} style={styles.restrictedItem}>
            <View style={styles.itemInfo}>
              <MaterialIcons name="local-bar" size={20} color={colors.orange} />
              <View style={styles.itemDetails}>
                <TextDefault H6 bold style={styles.itemName}>
                  {item.itemName}
                </TextDefault>
                <TextDefault H7 style={styles.itemType}>
                  {t('restrictedItemType', { type: item.itemType?.toLowerCase() })}
                </TextDefault>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.itemId)}
            >
              <Ionicons name="close" size={16} color={colors.red} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    )
  }

  const renderWarnings = () => {
    if (!warnings.length) return null

    return (
      <View style={styles.warningsContainer}>
        {warnings.map((warning, index) => (
          <View 
            key={index} 
            style={[
              styles.warningCard,
              { borderLeftColor: getWarningColor(warning.type) }
            ]}
          >
            <View style={styles.warningHeader}>
              <Ionicons 
                name={getWarningIcon(warning.type)} 
                size={20} 
                color={getWarningColor(warning.type)} 
              />
              <TextDefault H6 bold style={styles.warningMessage}>
                {warning.message}
              </TextDefault>
            </View>
            
            {warning.action === 'UPLOAD_ID' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getWarningColor(warning.type) }]}
                onPress={handleVerificationAction}
              >
                <TextDefault H6 bold style={styles.actionButtonText}>
                  {t('verifyAge')}
                </TextDefault>
              </TouchableOpacity>
            )}
            
            {warning.action === 'REMOVE_ITEM' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.red }]}
                onPress={() => handleRemoveItem(warning.itemId)}
              >
                <TextDefault H6 bold style={styles.actionButtonText}>
                  {t('removeItem')}
                </TextDefault>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderVerificationStatus()}
      {renderRestrictedItems()}
      {renderWarnings()}
      
      {/* Age Verification CTA */}
      {!verificationStatus?.isVerified && (
        <View style={styles.ctaContainer}>
          <View style={styles.ctaContent}>
            <Ionicons name="shield-checkmark" size={32} color={colors.blue} />
            <View style={styles.ctaText}>
              <TextDefault H5 bold style={styles.ctaTitle}>
                {t('ageVerificationRequired')}
              </TextDefault>
              <TextDefault H6 style={styles.ctaMessage}>
                {t('ageVerificationCTAMessage')}
              </TextDefault>
            </View>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleVerificationAction}
          >
            <TextDefault H6 bold style={styles.ctaButtonText}>
              {t('verifyNow')}
            </TextDefault>
            <Ionicons name="arrow-forward" size={16} color={colors.buttonText} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: verticalScale(8)
  },
  statusCard: {
    padding: scale(16),
    borderRadius: scale(8),
    marginBottom: verticalScale(12),
    borderWidth: 1
  },
  successCard: {
    backgroundColor: colors.green + '10',
    borderColor: colors.green + '30'
  },
  pendingCard: {
    backgroundColor: colors.orange + '10',
    borderColor: colors.orange + '30'
  },
  errorCard: {
    backgroundColor: colors.red + '10',
    borderColor: colors.red + '30'
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8)
  },
  statusTitle: {
    marginLeft: scale(8)
  },
  statusMessage: {
    color: colors.fontSecondColor
  },
  restrictedItemsContainer: {
    marginBottom: verticalScale(12)
  },
  sectionTitle: {
    color: colors.fontMainColor,
    marginBottom: verticalScale(8)
  },
  restrictedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(12),
    backgroundColor: colors.cardContainer,
    borderRadius: scale(6),
    marginBottom: verticalScale(6),
    borderLeftWidth: 3,
    borderLeftColor: colors.orange
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  itemDetails: {
    marginLeft: scale(8),
    flex: 1
  },
  itemName: {
    color: colors.fontMainColor
  },
  itemType: {
    color: colors.fontSecondColor,
    textTransform: 'capitalize'
  },
  removeButton: {
    padding: scale(4)
  },
  warningsContainer: {
    marginBottom: verticalScale(12)
  },
  warningCard: {
    padding: scale(12),
    backgroundColor: colors.cardContainer,
    borderRadius: scale(6),
    marginBottom: verticalScale(8),
    borderLeftWidth: 4
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8)
  },
  warningMessage: {
    color: colors.fontMainColor,
    marginLeft: scale(8),
    flex: 1
  },
  actionButton: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(4),
    alignSelf: 'flex-start',
    marginTop: verticalScale(4)
  },
  actionButtonText: {
    color: colors.buttonText
  },
  ctaContainer: {
    backgroundColor: colors.cardContainer,
    borderRadius: scale(8),
    padding: scale(16),
    borderWidth: 1,
    borderColor: colors.blue + '30'
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12)
  },
  ctaText: {
    marginLeft: scale(12),
    flex: 1
  },
  ctaTitle: {
    color: colors.fontMainColor,
    marginBottom: verticalScale(4)
  },
  ctaMessage: {
    color: colors.fontSecondColor
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(6)
  },
  ctaButtonText: {
    color: colors.buttonText,
    marginRight: scale(6)
  }
})

export default AgeVerificationWarning