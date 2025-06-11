import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native'
import { Camera } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useMutation, useQuery } from '@apollo/client'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { useTranslation } from 'react-i18next'

import { UPLOAD_AGE_VERIFICATION, GET_AGE_VERIFICATION_STATUS } from '../../apollo/mutations'
import { colors, scale, verticalScale } from '../../utils'
import TextDefault from '../Text/TextDefault/TextDefault'
import { FlashMessage } from '../../utils/FlashMessage'

const AgeVerificationUpload = ({ navigation, onSuccess }) => {
  const { t } = useTranslation()
  const [selectedImage, setSelectedImage] = useState(null)
  const [documentType, setDocumentType] = useState('DRIVERS_LICENSE')
  const [dateOfBirth, setDateOfBirth] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const cameraRef = useRef(null)

  const { data: verificationStatus, refetch } = useQuery(GET_AGE_VERIFICATION_STATUS)

  const [uploadVerification] = useMutation(UPLOAD_AGE_VERIFICATION, {
    onCompleted: (data) => {
      if (data.uploadAgeVerificationDocument.success) {
        FlashMessage({
          message: t('ageVerificationUploadSuccess'),
          type: 'success'
        })
        refetch()
        onSuccess && onSuccess(data.uploadAgeVerificationDocument.verificationInfo)
      }
    },
    onError: (error) => {
      console.error('Upload error:', error)
      FlashMessage({
        message: error.message || t('ageVerificationUploadError'),
        type: 'warning'
      })
    }
  })

  const documentTypes = [
    { label: t('driversLicense'), value: 'DRIVERS_LICENSE' },
    { label: t('passport'), value: 'PASSPORT' },
    { label: t('nationalId'), value: 'NATIONAL_ID' },
    { label: t('stateId'), value: 'STATE_ID' }
  ]

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        t('permissionRequired'),
        t('cameraPermissionMessage'),
        [{ text: t('ok') }]
      )
      return false
    }
    return true
  }

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        t('permissionRequired'),
        t('galleryPermissionMessage'),
        [{ text: t('ok') }]
      )
      return false
    }
    return true
  }

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0])
    }
  }

  const pickFromGallery = async () => {
    const hasPermission = await requestGalleryPermission()
    if (!hasPermission) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0])
    }
  }

  const showImagePicker = () => {
    Alert.alert(
      t('selectImage'),
      t('selectImageMessage'),
      [
        { text: t('camera'), onPress: takePhoto },
        { text: t('gallery'), onPress: pickFromGallery },
        { text: t('cancel'), style: 'cancel' }
      ]
    )
  }

  const validateAge = (birthDate) => {
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert(t('error'), t('pleaseSelectImage'))
      return
    }

    const age = validateAge(dateOfBirth)
    if (age < 18) {
      Alert.alert(t('error'), t('mustBe18OrOlder'))
      return
    }

    setIsUploading(true)

    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append('file', {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: selectedImage.fileName || 'id-document.jpg'
      })

      const variables = {
        file: formData,
        input: {
          documentType,
          dateOfBirth: dateOfBirth.toISOString()
        }
      }

      await uploadVerification({ variables })
    } catch (error) {
      console.error('Upload error:', error)
      FlashMessage({
        message: t('uploadFailed'),
        type: 'warning'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setDateOfBirth(selectedDate)
    }
  }

  // If already verified, show status
  if (verificationStatus?.getAgeVerificationStatus?.isVerified) {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.green} />
          <TextDefault H3 bold style={styles.statusTitle}>
            {t('ageVerified')}
          </TextDefault>
          <TextDefault H5 style={styles.statusMessage}>
            {t('ageVerifiedMessage')}
          </TextDefault>
          <View style={styles.statusDetails}>
            <TextDefault H5>
              {t('age')}: {verificationStatus.getAgeVerificationStatus.age}
            </TextDefault>
            <TextDefault H5>
              {t('canPurchaseRestricted')}: {verificationStatus.getAgeVerificationStatus.canPurchaseRestricted ? t('yes') : t('no')}
            </TextDefault>
          </View>
        </View>
      </View>
    )
  }

  // If pending review
  if (verificationStatus?.getAgeVerificationStatus?.status === 'PENDING') {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <MaterialIcons name="pending" size={64} color={colors.orange} />
          <TextDefault H3 bold style={styles.statusTitle}>
            {t('verificationPending')}
          </TextDefault>
          <TextDefault H5 style={styles.statusMessage}>
            {t('verificationPendingMessage')}
          </TextDefault>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TextDefault H2 bold style={styles.title}>
          {t('ageVerification')}
        </TextDefault>
        <TextDefault H5 style={styles.subtitle}>
          {t('ageVerificationSubtitle')}
        </TextDefault>
      </View>

      {/* Document Type Selection */}
      <View style={styles.section}>
        <TextDefault H4 bold style={styles.sectionTitle}>
          {t('documentType')}
        </TextDefault>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={documentType}
            onValueChange={setDocumentType}
            style={styles.picker}
          >
            {documentTypes.map((type) => (
              <Picker.Item
                key={type.value}
                label={type.label}
                value={type.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Date of Birth */}
      <View style={styles.section}>
        <TextDefault H4 bold style={styles.sectionTitle}>
          {t('dateOfBirth')}
        </TextDefault>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <TextDefault H5>
            {dateOfBirth.toLocaleDateString()}
          </TextDefault>
          <Ionicons name="calendar" size={20} color={colors.fontSecondColor} />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </View>

      {/* Image Upload */}
      <View style={styles.section}>
        <TextDefault H4 bold style={styles.sectionTitle}>
          {t('uploadDocument')}
        </TextDefault>
        <TextDefault H6 style={styles.uploadInstructions}>
          {t('uploadInstructions')}
        </TextDefault>

        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={showImagePicker}
            >
              <TextDefault H5 bold style={styles.changeImageText}>
                {t('changeImage')}
              </TextDefault>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={showImagePicker}>
            <Ionicons name="camera" size={32} color={colors.fontSecondColor} />
            <TextDefault H5 style={styles.uploadButtonText}>
              {t('selectImage')}
            </TextDefault>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedImage || isUploading) && styles.submitButtonDisabled
        ]}
        onPress={handleUpload}
        disabled={!selectedImage || isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <TextDefault H4 bold style={styles.submitButtonText}>
            {t('submitVerification')}
          </TextDefault>
        )}
      </TouchableOpacity>

      {/* Legal Notice */}
      <View style={styles.legalNotice}>
        <TextDefault H6 style={styles.legalText}>
          {t('ageVerificationLegalNotice')}
        </TextDefault>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.themeBackground,
    padding: scale(16)
  },
  header: {
    marginBottom: verticalScale(24)
  },
  title: {
    color: colors.fontMainColor,
    textAlign: 'center',
    marginBottom: verticalScale(8)
  },
  subtitle: {
    color: colors.fontSecondColor,
    textAlign: 'center'
  },
  section: {
    marginBottom: verticalScale(24)
  },
  sectionTitle: {
    color: colors.fontMainColor,
    marginBottom: verticalScale(12)
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.horizontalLine,
    borderRadius: scale(8),
    backgroundColor: colors.cardContainer
  },
  picker: {
    height: verticalScale(50)
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    borderWidth: 1,
    borderColor: colors.horizontalLine,
    borderRadius: scale(8),
    backgroundColor: colors.cardContainer
  },
  uploadInstructions: {
    color: colors.fontSecondColor,
    marginBottom: verticalScale(12),
    textAlign: 'center'
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(32),
    borderWidth: 2,
    borderColor: colors.horizontalLine,
    borderStyle: 'dashed',
    borderRadius: scale(8),
    backgroundColor: colors.cardContainer
  },
  uploadButtonText: {
    color: colors.fontSecondColor,
    marginTop: verticalScale(8)
  },
  imageContainer: {
    alignItems: 'center'
  },
  selectedImage: {
    width: scale(200),
    height: scale(150),
    borderRadius: scale(8),
    marginBottom: verticalScale(12)
  },
  changeImageButton: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    backgroundColor: colors.buttonBackground,
    borderRadius: scale(6)
  },
  changeImageText: {
    color: colors.buttonText
  },
  submitButton: {
    backgroundColor: colors.buttonBackground,
    padding: scale(16),
    borderRadius: scale(8),
    alignItems: 'center',
    marginVertical: verticalScale(16)
  },
  submitButtonDisabled: {
    backgroundColor: colors.fontSecondColor,
    opacity: 0.6
  },
  submitButtonText: {
    color: colors.buttonText
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(32)
  },
  statusTitle: {
    color: colors.fontMainColor,
    marginVertical: verticalScale(16),
    textAlign: 'center'
  },
  statusMessage: {
    color: colors.fontSecondColor,
    textAlign: 'center',
    marginBottom: verticalScale(24)
  },
  statusDetails: {
    alignItems: 'center'
  },
  legalNotice: {
    marginTop: verticalScale(16),
    padding: scale(16),
    backgroundColor: colors.cardContainer,
    borderRadius: scale(8)
  },
  legalText: {
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 20
  }
})

export default AgeVerificationUpload