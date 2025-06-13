# CigarUnderground Admin Setup Guide

This guide explains how to set up and manage the global super admin for the CigarUnderground food delivery platform.

## 🎯 Overview

The CigarUnderground platform uses a role-based access control system with two main user types:

- **Super Admin**: Global administrator with full system access
- **Restaurant Admin**: Store-specific administrator with limited permissions

## 🚀 Quick Start

### Automatic Setup (Recommended)

The super admin is automatically created when you start the system:

```bash
# Start the entire system
./bin/test --full

# Or start with Docker Compose
docker-compose up -d
```

### Default Super Admin Credentials

```
Email: admin@cigarunderground.org
Password: CigarAdmin2024!
```

**⚠️ IMPORTANT: Change the default password after first login!**

## 🛠️ Manual Admin Management

### Using the Admin Manager Script

The `scripts/admin-manager.js` script provides command-line tools for managing admin users:

```bash
# Install dependencies first (if not already installed)
npm install mongodb bcrypt

# Create super admin
node scripts/admin-manager.js create

# Create with custom password
node scripts/admin-manager.js create "MySecurePassword123!"

# List all admin users
node scripts/admin-manager.js list

# Reset admin password
node scripts/admin-manager.js reset admin@cigarunderground.org "NewPassword123!"

# Delete admin user
node scripts/admin-manager.js delete admin@cigarunderground.org

# Force recreate existing admin
node scripts/admin-manager.js create --force
```

### Using MongoDB Shell

You can also manage admins directly via MongoDB:

```bash
# Connect to MongoDB
docker exec -it cigarunderground-mongo1 mongosh

# Switch to database
use cigarunderground

# Find all admin users
db.users.find({ userType: "SUPER_ADMIN" })

# Create new admin (password must be hashed)
db.users.insertOne({
  email: "newadmin@cigarunderground.org",
  password: "$2b$12$...", // Use bcrypt to hash
  name: "New Admin",
  userType: "SUPER_ADMIN",
  permissions: [...], // Full permissions array
  isActive: true,
  createdAt: new Date()
})
```

## 🔐 Security Features

### Password Requirements

- Minimum 8 characters
- Must include uppercase, lowercase, numbers, and special characters
- Passwords are hashed using bcrypt with 12 salt rounds

### Account Security

- Account lockout after 5 failed login attempts
- Session timeout after 24 hours of inactivity
- Email verification required for new accounts
- Two-factor authentication support (optional)

### Permissions System

Super admins have access to all system features:

#### System Management
- `MANAGE_USERS` - Create, edit, delete users
- `MANAGE_STAFF` - Manage staff accounts
- `MANAGE_ROLES` - Configure user roles
- `MANAGE_PERMISSIONS` - Set user permissions

#### Restaurant Management
- `MANAGE_RESTAURANTS` - Add/edit restaurants
- `MANAGE_VENDORS` - Vendor management
- `APPROVE_RESTAURANTS` - Approve new restaurants

#### Product Management
- `MANAGE_CATEGORIES` - Food categories
- `MANAGE_CUISINES` - Cuisine types
- `MANAGE_FOODS` - Food items
- `MANAGE_ADDONS` - Food add-ons

#### Order Management
- `VIEW_ALL_ORDERS` - See all orders
- `MANAGE_ORDERS` - Edit order details
- `CANCEL_ORDERS` - Cancel orders

#### Financial Management
- `VIEW_EARNINGS` - View platform earnings
- `MANAGE_COMMISSION_RATES` - Set commission rates
- `MANAGE_WITHDRAW_REQUESTS` - Process withdrawals

#### Age Verification
- `MANAGE_AGE_VERIFICATION` - Oversee age verification
- `APPROVE_AGE_VERIFICATION` - Approve verifications
- `REJECT_AGE_VERIFICATION` - Reject verifications

## 🌐 Admin Panel Access

### Local Development
- URL: `http://localhost:10701`
- Login with super admin credentials

### Production
- URL: `https://admin.cigarunderground.org`
- Ensure SSL certificate is properly configured

### Admin Panel Features

1. **Dashboard**
   - System overview
   - Key metrics
   - Recent activity

2. **User Management**
   - View all users
   - Manage user accounts
   - Age verification reviews

3. **Restaurant Management**
   - Restaurant approval
   - Menu management
   - Store settings

4. **Order Management**
   - Order tracking
   - Order history
   - Dispute resolution

5. **Financial Management**
   - Earnings reports
   - Commission settings
   - Withdrawal processing

6. **System Configuration**
   - Platform settings
   - Notification management
   - Zone configuration

## 🔧 Troubleshooting

### Common Issues

#### Cannot Login
1. Verify credentials are correct
2. Check if account is locked
3. Ensure MongoDB is running
4. Check network connectivity

```bash
# Reset password if needed
node scripts/admin-manager.js reset admin@cigarunderground.org "NewPassword123!"
```

#### Admin Not Found
1. Check if admin was created during setup
2. Verify database connection
3. Recreate admin if necessary

```bash
# List existing admins
node scripts/admin-manager.js list

# Create new admin if none exist
node scripts/admin-manager.js create
```

#### Permission Denied
1. Verify user has SUPER_ADMIN type
2. Check permissions array
3. Ensure account is active

```bash
# Check admin details in MongoDB
docker exec -it cigarunderground-mongo1 mongosh
use cigarunderground
db.users.findOne({ email: "admin@cigarunderground.org" })
```

### Database Connection Issues

If you can't connect to MongoDB:

```bash
# Check MongoDB containers
docker ps | grep mongo

# Check MongoDB logs
docker logs cigarunderground-mongo1

# Restart MongoDB if needed
docker-compose restart cigarunderground-mongo1
```

## 📝 Best Practices

### Security
1. **Change default password immediately**
2. **Use strong, unique passwords**
3. **Enable two-factor authentication**
4. **Regularly review admin accounts**
5. **Monitor login activity**

### Account Management
1. **Create separate accounts for each admin**
2. **Use principle of least privilege**
3. **Regularly audit permissions**
4. **Remove unused accounts**
5. **Keep contact information updated**

### Backup and Recovery
1. **Regular database backups**
2. **Test restore procedures**
3. **Document admin account details**
4. **Maintain offline access methods**

## 🆘 Emergency Access

If you lose access to all admin accounts:

1. **Database Access Method**:
   ```bash
   # Connect directly to MongoDB
   docker exec -it cigarunderground-mongo1 mongosh
   use cigarunderground
   
   # Create emergency admin
   db.users.insertOne({
     email: "emergency@cigarunderground.org",
     password: "$2b$12$LQv3c1yqBwEHxv07iGOCOeOehHKBfqmCAp7VuP2S4HWuLxEJmcxlW",
     name: "Emergency Admin",
     userType: "SUPER_ADMIN",
     permissions: ["MANAGE_USERS", "MANAGE_STAFF"], // Minimal permissions
     isActive: true,
     createdAt: new Date()
   })
   ```

2. **Script Method**:
   ```bash
   # Use admin manager script
   node scripts/admin-manager.js create "EmergencyPassword123!" --force
   ```

3. **Container Restart**:
   ```bash
   # Restart mongo-setup to recreate default admin
   docker-compose restart cigarunderground-mongo-setup
   ```

## 📞 Support

For additional support:

- **Documentation**: Check this file and inline code comments
- **Logs**: Review container logs for error details
- **Database**: Direct MongoDB access for troubleshooting
- **Scripts**: Use provided management scripts for common tasks

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Platform**: CigarUnderground Food Delivery