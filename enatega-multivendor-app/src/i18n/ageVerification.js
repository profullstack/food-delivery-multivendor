export const ageVerificationTranslations = {
  en: {
    // Age Verification General
    ageVerification: 'Age Verification',
    ageVerificationSubtitle: 'Upload a valid ID to verify your age for purchasing restricted items',
    ageVerificationRequired: 'Age Verification Required',
    ageVerificationRequiredMessage: 'You need to verify your age to purchase {{itemName}}. Please upload a valid ID document.',
    ageVerificationCTAMessage: 'Verify your age to purchase tobacco and alcohol products',
    
    // Document Types
    documentType: 'Document Type',
    driversLicense: "Driver's License",
    passport: 'Passport',
    nationalId: 'National ID',
    stateId: 'State ID',
    
    // Date of Birth
    dateOfBirth: 'Date of Birth',
    mustBe18OrOlder: 'You must be 18 years or older to use this service',
    
    // Upload Process
    uploadDocument: 'Upload Document',
    uploadInstructions: 'Take a clear photo of your ID document. Make sure all text is readable and the image is not blurry.',
    selectImage: 'Select Image',
    selectImageMessage: 'Choose how you want to add your ID photo',
    camera: 'Camera',
    gallery: 'Gallery',
    cancel: 'Cancel',
    changeImage: 'Change Image',
    pleaseSelectImage: 'Please select an image of your ID document',
    submitVerification: 'Submit for Verification',
    
    // Status Messages
    ageVerified: 'Age Verified',
    ageVerifiedMessage: 'Your age has been verified successfully',
    ageVerifiedCanPurchase: 'Age verified ({{age}} years). You can purchase restricted items.',
    verificationPending: 'Verification Pending',
    verificationPendingMessage: 'Your ID is being reviewed by our team. This usually takes 24-48 hours.',
    verificationPendingCartMessage: 'Your age verification is being reviewed. You cannot checkout with restricted items until approved.',
    verificationRejected: 'Verification Rejected',
    verificationRejectedMessage: 'Your ID verification was rejected. Please upload a new document.',
    verificationRejectedCartMessage: 'Your age verification was rejected. Please upload a new document to purchase restricted items.',
    
    // Upload Results
    ageVerificationUploadSuccess: 'Document uploaded successfully',
    ageVerificationUploadError: 'Failed to upload document',
    documentUploadedSuccessfully: 'Document uploaded successfully',
    uploadFailed: 'Upload failed. Please try again.',
    
    // Permissions
    permissionRequired: 'Permission Required',
    cameraPermissionMessage: 'Camera permission is required to take photos of your ID document.',
    galleryPermissionMessage: 'Gallery permission is required to select photos from your device.',
    ok: 'OK',
    
    // Cart and Checkout
    restrictedItemsInCart: 'Restricted Items in Cart',
    restrictedItemType: '{{type}} product',
    ageVerificationRequiredFor: 'Age verification required for {{itemName}}',
    verificationPendingFor: 'Verification pending for {{itemName}}',
    verificationRejectedFor: 'Verification rejected for {{itemName}}',
    ageRestrictionFor: '{{itemName}} requires age {{minimumAge}}+',
    removeRestrictedItem: 'Remove Restricted Item',
    removeRestrictedItemMessage: 'This item requires age verification. Would you like to remove it from your cart?',
    remove: 'Remove',
    removeItem: 'Remove Item',
    verifyAge: 'Verify Age',
    verifyNow: 'Verify Now',
    canPurchaseRestricted: 'Can purchase restricted items',
    yes: 'Yes',
    no: 'No',
    age: 'Age',
    
    // Notifications
    ageVerificationApproved: 'Age Verification Approved!',
    youCanNowPurchaseRestrictedItems: 'You can now purchase tobacco and alcohol products.',
    ageVerificationRejected: 'Age Verification Rejected',
    pleaseUploadNewDocument: 'Please upload a new, clearer image of your ID.',
    newAgeVerificationSubmission: 'New age verification submitted',
    
    // Legal and Compliance
    ageVerificationLegalNotice: 'By submitting your ID, you agree to our age verification process. Your document will be securely stored and used only for age verification purposes. You must be 21+ to purchase tobacco and alcohol products.',
    restrictedItemPurchase: 'Restricted Item Purchase',
    restrictedItemMessage: 'You are trying to purchase {{itemName}}, a {{itemType}} product that requires age verification.',
    
    // Error Messages
    error: 'Error',
    loadingVerificationStatus: 'Loading verification status...',
    failedToLoadVerificationStatus: 'Failed to load verification status',
    noVerificationFound: 'No age verification found',
    noVerificationMessage: 'You have not submitted age verification yet',
    
    // Actions
    uploadNewDocument: 'Upload New Document',
    uploadDocument: 'Upload Document',
    
    // Admin/Review Messages (for admin notifications)
    newSubmissionReceived: 'New age verification submission received',
    reviewRequired: 'Review required for age verification',
    
    // Age Verification Summary
    ageVerifiedMessage: 'Verified ({{age}} years old)',
    verificationPendingMessage: 'Under review - usually takes 24-48 hours',
    verificationRejectedMessage: 'Rejected - please upload a new document',
    noVerificationMessage: 'Not verified - upload your ID to get started'
  },
  
  es: {
    // Spanish translations
    ageVerification: 'Verificación de Edad',
    ageVerificationSubtitle: 'Sube una identificación válida para verificar tu edad para comprar artículos restringidos',
    ageVerificationRequired: 'Verificación de Edad Requerida',
    ageVerificationRequiredMessage: 'Necesitas verificar tu edad para comprar {{itemName}}. Por favor sube un documento de identificación válido.',
    
    documentType: 'Tipo de Documento',
    driversLicense: 'Licencia de Conducir',
    passport: 'Pasaporte',
    nationalId: 'Cédula Nacional',
    stateId: 'Identificación Estatal',
    
    dateOfBirth: 'Fecha de Nacimiento',
    mustBe18OrOlder: 'Debes tener 18 años o más para usar este servicio',
    
    uploadDocument: 'Subir Documento',
    uploadInstructions: 'Toma una foto clara de tu documento de identificación. Asegúrate de que todo el texto sea legible y la imagen no esté borrosa.',
    selectImage: 'Seleccionar Imagen',
    camera: 'Cámara',
    gallery: 'Galería',
    cancel: 'Cancelar',
    submitVerification: 'Enviar para Verificación',
    
    ageVerified: 'Edad Verificada',
    ageVerifiedMessage: 'Tu edad ha sido verificada exitosamente',
    verificationPending: 'Verificación Pendiente',
    verificationPendingMessage: 'Tu identificación está siendo revisada por nuestro equipo. Esto usualmente toma 24-48 horas.',
    verificationRejected: 'Verificación Rechazada',
    verificationRejectedMessage: 'Tu verificación de identificación fue rechazada. Por favor sube un nuevo documento.',
    
    ok: 'OK',
    error: 'Error',
    remove: 'Eliminar',
    verifyAge: 'Verificar Edad',
    age: 'Edad'
  },
  
  fr: {
    // French translations
    ageVerification: 'Vérification d\'Âge',
    ageVerificationSubtitle: 'Téléchargez une pièce d\'identité valide pour vérifier votre âge pour l\'achat d\'articles restreints',
    ageVerificationRequired: 'Vérification d\'Âge Requise',
    ageVerificationRequiredMessage: 'Vous devez vérifier votre âge pour acheter {{itemName}}. Veuillez télécharger un document d\'identité valide.',
    
    documentType: 'Type de Document',
    driversLicense: 'Permis de Conduire',
    passport: 'Passeport',
    nationalId: 'Carte d\'Identité Nationale',
    stateId: 'Carte d\'Identité d\'État',
    
    dateOfBirth: 'Date de Naissance',
    mustBe18OrOlder: 'Vous devez avoir 18 ans ou plus pour utiliser ce service',
    
    uploadDocument: 'Télécharger le Document',
    uploadInstructions: 'Prenez une photo claire de votre pièce d\'identité. Assurez-vous que tout le texte soit lisible et que l\'image ne soit pas floue.',
    selectImage: 'Sélectionner une Image',
    camera: 'Appareil Photo',
    gallery: 'Galerie',
    cancel: 'Annuler',
    submitVerification: 'Soumettre pour Vérification',
    
    ageVerified: 'Âge Vérifié',
    ageVerifiedMessage: 'Votre âge a été vérifié avec succès',
    verificationPending: 'Vérification en Attente',
    verificationPendingMessage: 'Votre pièce d\'identité est en cours de révision par notre équipe. Cela prend généralement 24-48 heures.',
    verificationRejected: 'Vérification Rejetée',
    verificationRejectedMessage: 'Votre vérification d\'identité a été rejetée. Veuillez télécharger un nouveau document.',
    
    ok: 'OK',
    error: 'Erreur',
    remove: 'Supprimer',
    verifyAge: 'Vérifier l\'Âge',
    age: 'Âge'
  },
  
  de: {
    // German translations
    ageVerification: 'Altersverifikation',
    ageVerificationSubtitle: 'Laden Sie einen gültigen Ausweis hoch, um Ihr Alter für den Kauf eingeschränkter Artikel zu verifizieren',
    ageVerificationRequired: 'Altersverifikation Erforderlich',
    ageVerificationRequiredMessage: 'Sie müssen Ihr Alter verifizieren, um {{itemName}} zu kaufen. Bitte laden Sie ein gültiges Ausweisdokument hoch.',
    
    documentType: 'Dokumenttyp',
    driversLicense: 'Führerschein',
    passport: 'Reisepass',
    nationalId: 'Personalausweis',
    stateId: 'Staatsausweis',
    
    dateOfBirth: 'Geburtsdatum',
    mustBe18OrOlder: 'Sie müssen 18 Jahre oder älter sein, um diesen Service zu nutzen',
    
    uploadDocument: 'Dokument Hochladen',
    uploadInstructions: 'Machen Sie ein klares Foto Ihres Ausweisdokuments. Stellen Sie sicher, dass der gesamte Text lesbar und das Bild nicht unscharf ist.',
    selectImage: 'Bild Auswählen',
    camera: 'Kamera',
    gallery: 'Galerie',
    cancel: 'Abbrechen',
    submitVerification: 'Zur Verifikation Einreichen',
    
    ageVerified: 'Alter Verifiziert',
    ageVerifiedMessage: 'Ihr Alter wurde erfolgreich verifiziert',
    verificationPending: 'Verifikation Ausstehend',
    verificationPendingMessage: 'Ihr Ausweis wird von unserem Team überprüft. Dies dauert normalerweise 24-48 Stunden.',
    verificationRejected: 'Verifikation Abgelehnt',
    verificationRejectedMessage: 'Ihre Ausweisverifikation wurde abgelehnt. Bitte laden Sie ein neues Dokument hoch.',
    
    ok: 'OK',
    error: 'Fehler',
    remove: 'Entfernen',
    verifyAge: 'Alter Verifizieren',
    age: 'Alter'
  },
  
  ar: {
    // Arabic translations (RTL)
    ageVerification: 'التحقق من العمر',
    ageVerificationSubtitle: 'قم بتحميل هوية صالحة للتحقق من عمرك لشراء العناصر المقيدة',
    ageVerificationRequired: 'التحقق من العمر مطلوب',
    ageVerificationRequiredMessage: 'تحتاج إلى التحقق من عمرك لشراء {{itemName}}. يرجى تحميل وثيقة هوية صالحة.',
    
    documentType: 'نوع الوثيقة',
    driversLicense: 'رخصة القيادة',
    passport: 'جواز السفر',
    nationalId: 'الهوية الوطنية',
    stateId: 'هوية الولاية',
    
    dateOfBirth: 'تاريخ الميلاد',
    mustBe18OrOlder: 'يجب أن تكون 18 سنة أو أكثر لاستخدام هذه الخدمة',
    
    uploadDocument: 'تحميل الوثيقة',
    uploadInstructions: 'التقط صورة واضحة لوثيقة هويتك. تأكد من أن جميع النصوص مقروءة والصورة غير ضبابية.',
    selectImage: 'اختيار صورة',
    camera: 'الكاميرا',
    gallery: 'المعرض',
    cancel: 'إلغاء',
    submitVerification: 'إرسال للتحقق',
    
    ageVerified: 'تم التحقق من العمر',
    ageVerifiedMessage: 'تم التحقق من عمرك بنجاح',
    verificationPending: 'التحقق قيد الانتظار',
    verificationPendingMessage: 'هويتك قيد المراجعة من قبل فريقنا. هذا عادة ما يستغرق 24-48 ساعة.',
    verificationRejected: 'تم رفض التحقق',
    verificationRejectedMessage: 'تم رفض التحقق من هويتك. يرجى تحميل وثيقة جديدة.',
    
    ok: 'موافق',
    error: 'خطأ',
    remove: 'إزالة',
    verifyAge: 'التحقق من العمر',
    age: 'العمر'
  }
}

// Helper function to get age verification translations for a specific language
export const getAgeVerificationTranslations = (language = 'en') => {
  return ageVerificationTranslations[language] || ageVerificationTranslations.en
}

// Helper function to merge age verification translations with existing i18n resources
export const mergeAgeVerificationTranslations = (existingResources) => {
  const mergedResources = { ...existingResources }
  
  Object.keys(ageVerificationTranslations).forEach(language => {
    if (!mergedResources[language]) {
      mergedResources[language] = {}
    }
    
    mergedResources[language] = {
      ...mergedResources[language],
      ...ageVerificationTranslations[language]
    }
  })
  
  return mergedResources
}

export default ageVerificationTranslations