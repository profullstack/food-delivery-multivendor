// scripts/create-super-admin.js - Create default super admin user
// This script creates a global super admin for the CigarUnderground food delivery platform

print('🚀 Creating Super Admin User...');

// Switch to the cigarunderground database
const db = db.getSiblingDB('cigarunderground');

// Super Admin configuration
const superAdminConfig = {
  email: 'admin@cigarunderground.org',
  password: '$2b$12$LQv3c1yqBwEHxv07iGOCOeOehHKBfqmCAp7VuP2S4HWuLxEJmcxlW', // hashed 'CigarAdmin2024!'
  name: 'CigarUnderground Super Admin',
  phone: '+1-555-ADMIN-01',
  userType: 'SUPER_ADMIN',
  permissions: [
    // System Management
    'MANAGE_USERS',
    'MANAGE_STAFF',
    'MANAGE_ROLES',
    'MANAGE_PERMISSIONS',
    
    // Restaurant/Store Management
    'MANAGE_RESTAURANTS',
    'MANAGE_VENDORS',
    'MANAGE_STORES',
    'APPROVE_RESTAURANTS',
    
    // Product Management
    'MANAGE_CATEGORIES',
    'MANAGE_CUISINES',
    'MANAGE_FOODS',
    'MANAGE_ADDONS',
    'MANAGE_OPTIONS',
    
    // Order Management
    'VIEW_ALL_ORDERS',
    'MANAGE_ORDERS',
    'MANAGE_ORDER_STATUS',
    'CANCEL_ORDERS',
    
    // Financial Management
    'VIEW_EARNINGS',
    'MANAGE_COMMISSION_RATES',
    'MANAGE_WITHDRAW_REQUESTS',
    'VIEW_TRANSACTION_HISTORY',
    'MANAGE_COUPONS',
    'MANAGE_TIPPINGS',
    
    // Age Verification Management
    'MANAGE_AGE_VERIFICATION',
    'APPROVE_AGE_VERIFICATION',
    'REJECT_AGE_VERIFICATION',
    'VIEW_VERIFICATION_DOCUMENTS',
    
    // System Configuration
    'MANAGE_CONFIGURATIONS',
    'MANAGE_ZONES',
    'MANAGE_DISPATCH',
    'MANAGE_NOTIFICATIONS',
    'MANAGE_BANNERS',
    'MANAGE_APP_VERSIONS',
    
    // Customer Support
    'MANAGE_CUSTOMER_SUPPORT',
    'VIEW_SUPPORT_TICKETS',
    'RESPOND_TO_TICKETS',
    
    // Rider Management
    'MANAGE_RIDERS',
    'APPROVE_RIDERS',
    'VIEW_RIDER_LOCATIONS',
    
    // Analytics & Reports
    'VIEW_ANALYTICS',
    'EXPORT_REPORTS',
    'VIEW_DASHBOARD_STATS',
    
    // Settings
    'MANAGE_SETTINGS',
    'MANAGE_LANGUAGES',
    'MANAGE_SHOP_TYPES'
  ],
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isAgeVerified: true,
  ageVerificationStatus: 'approved',
  role: 'super_admin',
  userTypeId: null, // Super admin doesn't belong to specific restaurant
  restaurants: [], // Super admin manages all restaurants
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: null,
  loginAttempts: 0,
  isLocked: false,
  lockUntil: null
};

try {
  // Check if super admin already exists
  const existingAdmin = db.users.findOne({ 
    $or: [
      { email: superAdminConfig.email },
      { userType: 'SUPER_ADMIN' }
    ]
  });

  if (existingAdmin) {
    print('⚠️  Super admin user already exists:');
    print(`   Email: ${existingAdmin.email}`);
    print(`   Name: ${existingAdmin.name}`);
    print(`   User Type: ${existingAdmin.userType}`);
    print('   Skipping creation...');
  } else {
    // Create the super admin user
    const result = db.users.insertOne(superAdminConfig);
    
    if (result.acknowledged) {
      print('✅ Super Admin created successfully!');
      print('');
      print('📋 Super Admin Details:');
      print(`   Email: ${superAdminConfig.email}`);
      print(`   Password: CigarAdmin2024! (change after first login)`);
      print(`   Name: ${superAdminConfig.name}`);
      print(`   Phone: ${superAdminConfig.phone}`);
      print(`   User Type: ${superAdminConfig.userType}`);
      print(`   Permissions: ${superAdminConfig.permissions.length} permissions granted`);
      print('');
      print('🔐 Security Notes:');
      print('   - Password is securely hashed using bcrypt');
      print('   - Change the default password after first login');
      print('   - Enable 2FA for additional security');
      print('');
      print('🌐 Access URLs:');
      print('   - Admin Panel: http://localhost:10701');
      print('   - Production: https://admin.cigarunderground.org');
    } else {
      print('❌ Failed to create super admin user');
      quit(1);
    }
  }

  // Create staff collection if it doesn't exist
  try {
    db.createCollection('staff', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'name', 'userType'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
              description: 'must be a valid email address'
            },
            password: {
              bsonType: 'string',
              minLength: 6,
              description: 'must be a string with at least 6 characters'
            },
            name: {
              bsonType: 'string',
              description: 'must be a string'
            },
            phone: {
              bsonType: 'string',
              description: 'must be a string'
            },
            userType: {
              bsonType: 'string',
              enum: ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'STAFF'],
              description: 'must be one of the enum values'
            },
            permissions: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: 'must be an array of permission strings'
            },
            isActive: {
              bsonType: 'bool',
              description: 'must be a boolean'
            },
            restaurants: {
              bsonType: 'array',
              items: {
                bsonType: 'objectId'
              },
              description: 'must be an array of restaurant ObjectIds'
            },
            createdAt: {
              bsonType: 'date',
              description: 'must be a date'
            },
            updatedAt: {
              bsonType: 'date',
              description: 'must be a date'
            }
          }
        }
      }
    });
    
    // Create indexes for staff collection
    db.staff.createIndex({ email: 1 }, { unique: true });
    db.staff.createIndex({ userType: 1 });
    db.staff.createIndex({ isActive: 1 });
    db.staff.createIndex({ restaurants: 1 });
    
    print('✅ Staff collection created with validation schema');
  } catch (e) {
    if (e.codeName === 'NamespaceExists') {
      print('ℹ️  Staff collection already exists');
    } else {
      print('⚠️  Warning: Could not create staff collection:', e.message);
    }
  }

  // Create user types collection for role management
  try {
    db.createCollection('usertypes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'permissions'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'must be a string'
            },
            permissions: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: 'must be an array of permission strings'
            },
            isActive: {
              bsonType: 'bool',
              description: 'must be a boolean'
            },
            createdAt: {
              bsonType: 'date',
              description: 'must be a date'
            },
            updatedAt: {
              bsonType: 'date',
              description: 'must be a date'
            }
          }
        }
      }
    });

    // Insert default user types
    db.usertypes.insertMany([
      {
        name: 'SUPER_ADMIN',
        permissions: superAdminConfig.permissions,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'RESTAURANT_ADMIN',
        permissions: [
          'MANAGE_RESTAURANT_PROFILE',
          'MANAGE_RESTAURANT_FOODS',
          'MANAGE_RESTAURANT_CATEGORIES',
          'MANAGE_RESTAURANT_ADDONS',
          'MANAGE_RESTAURANT_OPTIONS',
          'VIEW_RESTAURANT_ORDERS',
          'MANAGE_RESTAURANT_ORDERS',
          'VIEW_RESTAURANT_EARNINGS',
          'MANAGE_RESTAURANT_COUPONS',
          'VIEW_RESTAURANT_RATINGS',
          'MANAGE_RESTAURANT_TIMING',
          'MANAGE_RESTAURANT_LOCATION'
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    print('✅ User types collection created with default roles');
  } catch (e) {
    if (e.codeName === 'NamespaceExists') {
      print('ℹ️  User types collection already exists');
    } else {
      print('⚠️  Warning: Could not create user types collection:', e.message);
    }
  }

  print('');
  print('🎉 Super Admin setup completed successfully!');
  print('');
  print('📝 Next Steps:');
  print('1. Access the admin panel at http://localhost:10701');
  print('2. Login with the credentials above');
  print('3. Change the default password');
  print('4. Configure system settings');
  print('5. Create additional staff users as needed');

} catch (error) {
  print('❌ Error creating super admin:', error.message);
  print('Stack trace:', error.stack);
  quit(1);
}

print('');
print('✨ CigarUnderground Super Admin setup complete!');