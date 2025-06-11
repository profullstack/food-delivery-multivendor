# CigarUnderground.org

![CigarUnderground Logo](assets/logo-cigar-underground.svg)

## Premium Cigar Delivery Platform

CigarUnderground.org is a sophisticated multi-vendor delivery platform specifically designed for premium cigars and tobacco products. Built with comprehensive age verification and compliance features to meet all federal and state regulations.

## 🚀 Features

### Core Platform
- **Multi-Vendor Marketplace**: Support for multiple cigar shops and tobacco retailers
- **Real-Time Delivery Tracking**: Live updates on order status and delivery progress
- **Advanced Search & Filtering**: Find cigars by brand, origin, strength, size, and price
- **User Reviews & Ratings**: Community-driven product reviews and ratings
- **Wishlist & Favorites**: Save preferred cigars and create custom collections

### Age Verification & Compliance
- **Mandatory Age Verification**: 21+ verification for all tobacco products
- **Document Upload System**: Secure ID verification with Cloudinary storage
- **Real-Time Status Updates**: Instant notifications on verification status
- **Admin Review Dashboard**: Manual review system for document verification
- **Automatic Enforcement**: Cart restrictions until age verification is complete
- **GDPR Compliance**: Secure handling of personal verification data

### Technical Stack
- **Backend**: Node.js, Express.js, GraphQL with Apollo Server
- **Database**: MongoDB with replica set for high availability
- **Frontend**: React Native (mobile), React.js (admin dashboard)
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary for secure document storage
- **Real-Time**: GraphQL subscriptions with Redis PubSub
- **Notifications**: Firebase push notifications
- **Containerization**: Docker Compose with full stack deployment

## 🏗️ Architecture

### Services
- **MongoDB Replica Set**: 3-node cluster for data persistence and high availability
- **Redis**: Caching layer and GraphQL subscription support
- **Backend API**: GraphQL API with age verification system
- **Nginx**: Reverse proxy with rate limiting and security headers
- **Admin Dashboard**: React.js application for vendor and verification management
- **Mobile App**: React Native application for customers

### Age Verification Workflow
1. **Customer Registration**: Basic account creation
2. **Product Browsing**: View cigars with age restriction warnings
3. **Cart Enforcement**: Age verification required before checkout
4. **Document Upload**: Secure ID upload with validation
5. **Admin Review**: Manual verification by trained staff
6. **Approval/Rejection**: Real-time status updates to customer
7. **Purchase Authorization**: Unrestricted access to tobacco products

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- MongoDB (handled by Docker)
- Redis (handled by Docker)

### Docker Deployment

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd cigar-underground
   cp .env.docker .env
   ```

2. **Configure environment:**
   Edit `.env` with your actual values:
   ```bash
   # Required for age verification
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Required for notifications
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   ```

3. **Start services:**
   ```bash
   docker compose up -d
   ```

4. **Verify deployment:**
   ```bash
   docker compose ps
   curl http://localhost/health
   ```

### Development Setup

1. **Backend development:**
   ```bash
   cd enatega-multivendor-backend
   npm install
   npm run dev
   ```

2. **Frontend development:**
   ```bash
   # Mobile app
   cd enatega-multivendor-app
   npm install
   expo start
   
   # Admin dashboard
   cd enatega-multivendor-admin
   npm install
   npm start
   ```

## 📱 Applications

### Customer Mobile App
- Browse premium cigars by category, brand, and origin
- Advanced filtering by strength, size, wrapper, and price
- Secure age verification with document upload
- Real-time order tracking and delivery updates
- User reviews and ratings system
- Wishlist and favorites management

### Vendor Dashboard
- Product catalog management
- Inventory tracking and updates
- Order processing and fulfillment
- Sales analytics and reporting
- Customer communication tools

### Admin Dashboard
- Age verification document review
- User account management
- Vendor onboarding and management
- Platform analytics and monitoring
- Compliance reporting and audit trails

## 🔒 Compliance & Security

### Age Verification Compliance
- **Federal Compliance**: Meets all federal tobacco sale regulations
- **State Compliance**: Configurable minimum age requirements
- **Document Security**: Encrypted storage with automatic expiration
- **Audit Trails**: Complete verification history and compliance reporting
- **Privacy Protection**: GDPR-compliant data handling and user rights

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive data validation and sanitization
- **HTTPS Enforcement**: SSL/TLS encryption for all communications
- **Database Security**: MongoDB with authentication and encryption
- **File Upload Security**: Validated and scanned document uploads

## 🌍 Multi-Language Support

The platform supports multiple languages for age verification:
- **English** (en)
- **Spanish** (es)
- **French** (fr)
- **German** (de)
- **Arabic** (ar) with RTL support

## 📊 Monitoring & Analytics

### Health Monitoring
- **Service Health Checks**: Automated monitoring of all services
- **Performance Metrics**: Response times and throughput monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Uptime Monitoring**: 24/7 availability tracking

### Business Analytics
- **Sales Reporting**: Revenue, orders, and product performance
- **User Analytics**: Registration, verification, and engagement metrics
- **Vendor Performance**: Sales, ratings, and fulfillment metrics
- **Compliance Reporting**: Age verification success rates and audit logs

## 🛠️ Development

### API Documentation
- **GraphQL Playground**: Available at `/graphql` in development
- **Schema Introspection**: Full API schema exploration
- **Real-Time Subscriptions**: WebSocket-based live updates
- **Authentication**: JWT-based API access control

### Database Schema
- **Users**: Customer accounts with age verification status
- **Products**: Cigar catalog with detailed specifications
- **Orders**: Purchase history and delivery tracking
- **Vendors**: Shop information and product catalogs
- **Age Verifications**: Document storage and review status

## 📞 Support

### For Customers
- **Age Verification Issues**: Contact support for verification assistance
- **Order Support**: Track orders and resolve delivery issues
- **Product Questions**: Get help with cigar selection and recommendations

### For Vendors
- **Onboarding**: Setup assistance for new tobacco retailers
- **Technical Support**: API integration and platform usage
- **Compliance Guidance**: Age verification and regulatory compliance

### For Developers
- **API Documentation**: Complete GraphQL schema and examples
- **Integration Guides**: Step-by-step integration instructions
- **Technical Support**: Development and deployment assistance

## 📄 License

This project is proprietary software for CigarUnderground.org. All rights reserved.

## 🤝 Contributing

This is a private commercial platform. For business inquiries, partnership opportunities, or vendor onboarding, please contact us through our website.

---

**CigarUnderground.org** - Premium Cigars, Delivered Responsibly
