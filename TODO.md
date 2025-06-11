# TODO: New Features for Enatega Multi-vendor Food Delivery Solution

## Feature: ID Photo Upload and Storage

### Overview
Implement ID photo upload functionality with secure storage integration across all platform modules (Admin, Customer App, Rider App, Store App, and Web) to enhance user verification and security.

### Technical Requirements

#### 1. Backend Implementation (Node.js/GraphQL)
- **New GraphQL Mutations:**
  - `uploadIdPhoto(file: Upload!, userType: UserType!): UploadResponse!`
  - `updateIdPhotoStatus(userId: ID!, status: IdPhotoStatus!): User!`
  - `deleteIdPhoto(userId: ID!): Boolean!`

- **New GraphQL Queries:**
  - `getIdPhotoStatus(userId: ID!): IdPhotoInfo!`
  - `getIdPhotosForReview(limit: Int, offset: Int): [IdPhotoReview!]!`

- **Database Schema Updates:**
  ```javascript
  // User Schema Extension
  idPhoto: {
    url: String,
    uploadedAt: Date,
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING'
    },
    rejectionReason: String,
    expiryDate: Date,
    fileSize: Number,
    mimeType: String,
    originalName: String
  }
  ```

- **Storage Integration:**
  - Extend existing Cloudinary integration for ID photo storage
  - Implement secure folder structure: `/id-photos/{userType}/{userId}/`
  - Add image optimization and compression
  - Implement automatic backup to secondary storage

- **Security & Validation:**
  - File type validation (JPEG, PNG only)
  - File size limits (max 5MB)
  - Image dimension validation (min 800x600px)
  - Virus scanning integration
  - Rate limiting for uploads (max 3 attempts per hour)

#### 2. Admin Dashboard (Next.js/React)
- **New Admin Pages:**
  - `/admin/id-verification` - Main ID verification dashboard
  - `/admin/id-verification/pending` - Pending reviews queue
  - `/admin/id-verification/history` - Verification history

- **Components to Create:**
  - `IdPhotoReviewCard.tsx` - Individual photo review component
  - `IdPhotoUploadModal.tsx` - Admin upload interface
  - `IdVerificationStats.tsx` - Statistics dashboard
  - `IdPhotoGallery.tsx` - Photo viewing component with zoom

- **Features:**
  - Bulk approval/rejection actions
  - Advanced filtering (by date, status, user type)
  - Export verification reports (PDF/CSV)
  - Real-time notifications for new uploads
  - Audit trail for all verification actions

#### 3. Customer Mobile App (React Native/Expo)
- **New Screens:**
  - `IdPhotoUpload.tsx` - Camera/gallery selection and upload
  - `IdVerificationStatus.tsx` - Upload status and history
  - `IdPhotoPreview.tsx` - Photo preview before upload

- **Components:**
  - `IdPhotoCamera.tsx` - Custom camera component with guidelines
  - `IdPhotoProgress.tsx` - Upload progress indicator
  - `IdVerificationBadge.tsx` - Verification status badge

- **Integration Points:**
  - Profile screen integration
  - Account verification flow
  - Order placement restrictions for unverified users
  - Push notifications for status updates

- **Camera Features:**
  - Auto-focus and exposure optimization
  - Face detection guidelines overlay
  - Image quality validation before upload
  - Retry mechanism for failed uploads

#### 4. Rider Mobile App (React Native/Expo)
- **Enhanced Verification Flow:**
  - Mandatory ID upload during onboarding
  - License verification integration
  - Vehicle registration photo linking
  - Background check status integration

- **New Components:**
  - `RiderIdUpload.tsx` - Rider-specific upload flow
  - `DocumentManager.tsx` - Manage all rider documents
  - `VerificationChecklist.tsx` - Onboarding progress tracker

#### 5. Store Management App (React Native/Expo)
- **Business Verification:**
  - Business license photo upload
  - Owner/manager ID verification
  - Food handler's permit upload
  - Health department certificates

- **Components:**
  - `BusinessDocumentUpload.tsx`
  - `StoreVerificationDashboard.tsx`
  - `ComplianceTracker.tsx`

#### 6. Web Application (Next.js/React)
- **Customer Portal:**
  - Web-based ID upload interface
  - Drag-and-drop file upload
  - Webcam capture functionality
  - Mobile-responsive design

- **Features:**
  - Progressive Web App (PWA) camera access
  - File compression before upload
  - Real-time upload progress
  - Accessibility compliance (WCAG 2.1)

### Implementation Phases

#### Phase 1: Backend Foundation (Week 1-2)
- [ ] Database schema updates
- [ ] GraphQL schema definitions
- [ ] Basic CRUD operations
- [ ] Cloudinary integration enhancement
- [ ] Security middleware implementation

#### Phase 2: Admin Dashboard (Week 3-4)
- [ ] Admin verification interface
- [ ] Review workflow implementation
- [ ] Statistics and reporting
- [ ] Notification system
- [ ] Audit logging

#### Phase 3: Mobile Applications (Week 5-7)
- [ ] Customer app integration
- [ ] Rider app enhancement
- [ ] Store app business verification
- [ ] Camera functionality
- [ ] Offline upload queue

#### Phase 4: Web Integration (Week 8)
- [ ] Web portal implementation
- [ ] PWA camera features
- [ ] Responsive design
- [ ] Cross-platform testing

#### Phase 5: Testing & Deployment (Week 9-10)
- [ ] Unit testing (Jest)
- [ ] Integration testing
- [ ] E2E testing (Cypress)
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment

### Technical Specifications

#### File Upload Specifications
```javascript
const ID_PHOTO_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  minDimensions: { width: 800, height: 600 },
  maxDimensions: { width: 4096, height: 4096 },
  compressionQuality: 0.8,
  thumbnailSize: { width: 200, height: 200 }
}
```

#### Storage Structure
```
cloudinary/
├── id-photos/
│   ├── customers/
│   │   └── {userId}/
│   │       ├── original/
│   │       ├── compressed/
│   │       └── thumbnail/
│   ├── riders/
│   ├── stores/
│   └── admins/
```

#### API Endpoints
```graphql
# Mutations
uploadIdPhoto(file: Upload!, metadata: IdPhotoMetadata!): UploadResponse!
updateIdPhotoStatus(userId: ID!, status: IdPhotoStatus!, reason: String): User!
deleteIdPhoto(userId: ID!): Boolean!

# Queries
getIdPhotoStatus(userId: ID!): IdPhotoInfo!
getIdPhotosForReview(filters: IdPhotoFilters!): IdPhotoReviewList!
getIdPhotoHistory(userId: ID!): [IdPhotoHistory!]!

# Subscriptions
idPhotoStatusUpdated(userId: ID!): IdPhotoStatusUpdate!
newIdPhotoUploaded: IdPhotoNotification!
```

### Security Considerations

#### Data Protection
- [ ] GDPR compliance for photo storage
- [ ] Automatic photo deletion after verification
- [ ] Encrypted storage for sensitive documents
- [ ] Access logging and monitoring
- [ ] Data retention policies

#### Privacy Features
- [ ] Photo blur/redaction for non-essential viewing
- [ ] Role-based access control
- [ ] Audit trail for all photo access
- [ ] User consent management
- [ ] Right to deletion implementation

### Integration with Existing Features

#### Authentication System
- Integrate with existing JWT authentication
- Extend user roles for verification permissions
- Add verification status to user context

#### Notification System
- Extend existing Firebase/Expo notification system
- Add email notifications for status updates
- SMS notifications for critical updates

#### File Management
- Leverage existing Cloudinary configuration
- Extend image optimization pipeline
- Integrate with existing file upload patterns

### Testing Strategy

#### Unit Tests
- [ ] GraphQL resolver testing
- [ ] File upload validation testing
- [ ] Image processing testing
- [ ] Database operation testing

#### Integration Tests
- [ ] End-to-end upload flow
- [ ] Cross-platform compatibility
- [ ] API integration testing
- [ ] Storage integration testing

#### Performance Tests
- [ ] Large file upload testing
- [ ] Concurrent upload testing
- [ ] Storage performance testing
- [ ] Mobile app performance testing

### Monitoring & Analytics

#### Metrics to Track
- Upload success/failure rates
- Average upload time
- Storage usage by user type
- Verification processing time
- User verification completion rates

#### Logging Requirements
- All upload attempts
- Verification decisions
- File access logs
- Error tracking and reporting
- Performance metrics

### Documentation Requirements

#### Technical Documentation
- [ ] API documentation updates
- [ ] Database schema documentation
- [ ] Security implementation guide
- [ ] Deployment procedures

#### User Documentation
- [ ] User upload guidelines
- [ ] Admin verification procedures
- [ ] Troubleshooting guides
- [ ] Privacy policy updates

### Estimated Timeline: 10 Weeks

**Total Effort:** ~400-500 development hours
**Team Size:** 3-4 developers (1 backend, 2 frontend, 1 mobile)
**Testing:** 2 weeks parallel to development
**Documentation:** 1 week

### Success Criteria

#### Functional Requirements
- [ ] Users can upload ID photos from all platforms
- [ ] Admins can review and approve/reject photos
- [ ] Real-time status updates across platforms
- [ ] Secure storage and access control
- [ ] GDPR compliance implementation

#### Performance Requirements
- [ ] Upload completion within 30 seconds
- [ ] 99.9% upload success rate
- [ ] Sub-2-second photo loading times
- [ ] Support for 10,000+ concurrent uploads

#### Security Requirements
- [ ] Zero data breaches
- [ ] Complete audit trail
- [ ] Encrypted data transmission
- [ ] Secure file storage
- [ ] Access control validation

---

## Additional Feature Ideas for Future Consideration

### 1. AI-Powered Verification
- Automatic ID document validation
- Face matching between profile and ID
- Fraud detection algorithms
- OCR for automatic data extraction

### 2. Blockchain Integration
- Immutable verification records
- Decentralized identity verification
- Smart contracts for automatic verification
- Cross-platform identity portability

### 3. Enhanced Security Features
- Biometric verification integration
- Multi-factor authentication
- Device fingerprinting
- Behavioral analysis

### 4. Advanced Analytics
- Verification pattern analysis
- Fraud detection reporting
- User behavior insights
- Compliance reporting automation

---

*This TODO document provides a comprehensive roadmap for implementing ID photo upload and storage functionality across the entire Enatega Multi-vendor Food Delivery Solution platform.*