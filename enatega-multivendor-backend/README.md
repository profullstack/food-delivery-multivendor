# Enatega Multi-vendor Backend - Age Verification System

This backend implementation provides comprehensive age verification functionality for the Enatega Multi-vendor Food Delivery Platform, specifically designed to handle tobacco and alcohol sales compliance.

## 🔞 Age Verification Features

### Core Functionality
- **Document Upload**: Secure ID document upload with Cloudinary integration
- **Admin Review**: Manual verification workflow for uploaded documents
- **Real-time Updates**: GraphQL subscriptions for status changes
- **Compliance Enforcement**: Automatic blocking of restricted item purchases
- **Audit Trail**: Complete tracking of verification activities

### Supported Document Types
- Driver's License
- Passport
- National ID
- State ID

### Age Requirements
- **Tobacco Products**: 21+ years (US federal requirement)
- **Alcohol Products**: 21+ years (US federal requirement)
- **General Restricted Items**: 18+ years

## 🏗️ Architecture

### Models
- **AgeVerification**: Core verification document and status tracking
- **User**: Extended with age verification relationship
- **Food**: Enhanced with restricted item flags and types

### GraphQL API
- **Queries**: Status checks, admin review queue
- **Mutations**: Document upload, admin review actions
- **Subscriptions**: Real-time status updates

### Middleware
- **Age Verification Middleware**: Automatic enforcement during checkout
- **File Validation**: Secure document upload validation
- **Authentication**: JWT-based user authentication

## 📁 Project Structure

```
enatega-multivendor-backend/
├── graphql/
│   ├── schema/
│   │   └── ageVerification.js      # GraphQL type definitions
│   └── resolvers/
│       └── ageVerification.js      # GraphQL resolvers
├── models/
│   ├── ageVerification.js          # Age verification data model
│   ├── user.js                     # User model with verification
│   └── food.js                     # Food model with restrictions
├── middleware/
│   └── ageVerification.js          # Checkout enforcement
├── helpers/
│   ├── validation.js               # Input validation utilities
│   ├── cloudinary.js               # Image upload handling
│   ├── notifications.js            # Push notification system
│   └── pubsub.js                   # GraphQL subscriptions
├── index.js                        # Main server file
├── package.json                    # Dependencies
└── .env.example                    # Environment configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Redis (for production subscriptions)
- Cloudinary account
- Firebase project (for notifications)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access GraphQL Playground**
   ```
   http://localhost:4000/graphql
   ```

### Environment Configuration

Key environment variables for age verification:

```env
# Age Verification
AGE_VERIFICATION_ENABLED=true
MINIMUM_AGE_TOBACCO=21
MINIMUM_AGE_ALCOHOL=21
VERIFICATION_EXPIRY_MONTHS=24

# Cloudinary (required)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Firebase (for notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
```

## 📊 GraphQL API Usage

### Upload Age Verification Document

```graphql
mutation UploadAgeVerification($file: Upload!, $input: AgeVerificationInput!) {
  uploadAgeVerificationDocument(file: $file, input: $input) {
    success
    message
    document {
      _id
      status
      submittedAt
    }
    verificationInfo {
      isVerified
      canPurchaseRestricted
      age
    }
  }
}
```

### Check Verification Status

```graphql
query GetAgeVerificationStatus {
  getAgeVerificationStatus {
    isVerified
    status
    canPurchaseRestricted
    restrictedItemTypes
    age
    verificationExpiryDate
  }
}
```

### Admin Review (Admin Only)

```graphql
mutation ReviewAgeVerification($input: AgeVerificationReviewInput!) {
  reviewAgeVerification(input: $input) {
    success
    message
    verificationInfo {
      isVerified
      status
    }
  }
}
```

### Real-time Status Updates

```graphql
subscription AgeVerificationUpdates {
  ageVerificationStatusUpdated {
    isVerified
    status
    canPurchaseRestricted
  }
}
```

## 🛡️ Security Features

### File Upload Security
- File type validation (JPEG, PNG only)
- File size limits (5MB max)
- Secure Cloudinary storage
- Automatic thumbnail generation

### Data Protection
- Encrypted document storage
- Audit trail logging
- GDPR compliance ready
- Automatic cleanup of expired verifications

### Access Control
- JWT-based authentication
- Role-based permissions (Admin/User)
- Rate limiting on uploads
- Secure API endpoints

## 🔄 Workflow

### User Verification Process
1. **Upload**: User uploads ID document via mobile app
2. **Validation**: System validates file format and user data
3. **Storage**: Document securely stored in Cloudinary
4. **Review**: Admin reviews document in admin panel
5. **Decision**: Admin approves or rejects verification
6. **Notification**: User receives real-time status update
7. **Enforcement**: System enforces age restrictions at checkout

### Admin Review Process
1. **Queue**: Pending verifications appear in admin dashboard
2. **Priority**: High-priority reviews (older submissions) shown first
3. **Review**: Admin examines document and user information
4. **Decision**: Approve with age confirmation or reject with reason
5. **Notification**: Automatic user notification sent
6. **Audit**: All actions logged for compliance

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Manual Testing
Use the GraphQL Playground at `http://localhost:4000/graphql` to test queries and mutations.

## 📱 Integration

### Mobile App Integration
The age verification system integrates with:
- **Customer App**: Document upload and status checking
- **Admin Dashboard**: Review and management interface
- **Store App**: Restricted item management
- **Rider App**: Age verification status display

### Frontend Components Needed
- Camera/gallery picker for document upload
- Age verification status display
- Restricted item warnings in cart
- Admin review interface

## 🔧 Configuration

### Restricted Items Setup
Mark food items as restricted in the database:

```javascript
// Example: Mark beer as restricted
await Food.findByIdAndUpdate(foodId, {
  isRestrictedItem: true,
  restrictedItemType: 'ALCOHOL',
  minimumAge: 21,
  restrictionNote: 'Valid ID required - Must be 21+'
})
```

### Notification Templates
Customize notification messages in `helpers/notifications.js`:

```javascript
const notifications = {
  VERIFIED: {
    title: '✅ Age Verification Approved',
    body: 'Your ID has been verified! You can now purchase restricted items.'
  },
  REJECTED: {
    title: '❌ Age Verification Rejected',
    body: 'Please upload a clearer image of your ID.'
  }
}
```

## 🚨 Compliance Notes

### Legal Requirements
- Implements US federal age requirements (21+ for tobacco/alcohol)
- Maintains audit trail for compliance reporting
- Supports document retention policies
- Enables age verification reporting

### Data Retention
- Verification documents: 2 years (configurable)
- Audit logs: 7 years (recommended)
- User verification status: Indefinite (until user deletion)

## 🔍 Monitoring

### Health Checks
- Server health: `GET /health`
- Database connectivity: Automatic monitoring
- Cloudinary status: Upload success tracking
- Redis connectivity: Subscription health

### Logging
- All verification attempts logged
- Admin actions tracked
- Error monitoring with structured logs
- Performance metrics collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

### Code Style
- ESLint configuration included
- Prettier formatting enforced
- JSDoc comments required for public methods

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

---

**Note**: This age verification system is designed for US compliance. International implementations may require modifications to meet local legal requirements.