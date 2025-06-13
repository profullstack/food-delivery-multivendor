#!/usr/bin/env node

// scripts/admin-manager.js - Command line tool for managing super admin
// Usage: node scripts/admin-manager.js [command] [options]

import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27020,localhost:27021,localhost:27022/cigarunderground?replicaSet=rs0';
const DB_NAME = 'cigarunderground';

// Super Admin default configuration
const DEFAULT_SUPER_ADMIN = {
  email: 'admin@cigarunderground.org',
  name: 'CigarUnderground Super Admin',
  phone: '+1-555-ADMIN-01',
  userType: 'SUPER_ADMIN',
  permissions: [
    'MANAGE_USERS', 'MANAGE_STAFF', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS',
    'MANAGE_RESTAURANTS', 'MANAGE_VENDORS', 'MANAGE_STORES', 'APPROVE_RESTAURANTS',
    'MANAGE_CATEGORIES', 'MANAGE_CUISINES', 'MANAGE_FOODS', 'MANAGE_ADDONS', 'MANAGE_OPTIONS',
    'VIEW_ALL_ORDERS', 'MANAGE_ORDERS', 'MANAGE_ORDER_STATUS', 'CANCEL_ORDERS',
    'VIEW_EARNINGS', 'MANAGE_COMMISSION_RATES', 'MANAGE_WITHDRAW_REQUESTS', 'VIEW_TRANSACTION_HISTORY',
    'MANAGE_COUPONS', 'MANAGE_TIPPINGS', 'MANAGE_AGE_VERIFICATION', 'APPROVE_AGE_VERIFICATION',
    'REJECT_AGE_VERIFICATION', 'VIEW_VERIFICATION_DOCUMENTS', 'MANAGE_CONFIGURATIONS',
    'MANAGE_ZONES', 'MANAGE_DISPATCH', 'MANAGE_NOTIFICATIONS', 'MANAGE_BANNERS',
    'MANAGE_APP_VERSIONS', 'MANAGE_CUSTOMER_SUPPORT', 'VIEW_SUPPORT_TICKETS',
    'RESPOND_TO_TICKETS', 'MANAGE_RIDERS', 'APPROVE_RIDERS', 'VIEW_RIDER_LOCATIONS',
    'VIEW_ANALYTICS', 'EXPORT_REPORTS', 'VIEW_DASHBOARD_STATS', 'MANAGE_SETTINGS',
    'MANAGE_LANGUAGES', 'MANAGE_SHOP_TYPES'
  ],
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isAgeVerified: true,
  ageVerificationStatus: 'approved',
  role: 'super_admin',
  userTypeId: null,
  restaurants: [],
  image: null
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Connect to MongoDB
 * @returns {Promise<{client: MongoClient, db: Db}>}
 */
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    return { client, db };
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

/**
 * Create super admin user
 * @param {string} password - Admin password
 * @param {object} options - Additional options
 */
async function createSuperAdmin(password = 'CigarAdmin2024!', options = {}) {
  const { client, db } = await connectToMongoDB();
  
  try {
    console.log('🚀 Creating Super Admin...');
    
    // Check if super admin already exists
    const existingAdmin = await db.collection('users').findOne({
      $or: [
        { email: DEFAULT_SUPER_ADMIN.email },
        { userType: 'SUPER_ADMIN' }
      ]
    });

    if (existingAdmin && !options.force) {
      console.log('⚠️  Super admin already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log('   Use --force to recreate');
      return;
    }

    if (existingAdmin && options.force) {
      console.log('🔄 Removing existing super admin...');
      await db.collection('users').deleteOne({ _id: existingAdmin._id });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create super admin user
    const superAdmin = {
      ...DEFAULT_SUPER_ADMIN,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      loginAttempts: 0,
      isLocked: false,
      lockUntil: null,
      ...options.overrides
    };

    const result = await db.collection('users').insertOne(superAdmin);
    
    if (result.acknowledged) {
      console.log('✅ Super Admin created successfully!');
      console.log('');
      console.log('📋 Super Admin Details:');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Name: ${superAdmin.name}`);
      console.log(`   Phone: ${superAdmin.phone}`);
      console.log(`   User Type: ${superAdmin.userType}`);
      console.log(`   Permissions: ${superAdmin.permissions.length} permissions`);
      console.log('');
      console.log('🌐 Access URLs:');
      console.log('   - Local: http://localhost:10701');
      console.log('   - Production: https://admin.cigarunderground.org');
    }
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
  } finally {
    await client.close();
  }
}

/**
 * List all admin users
 */
async function listAdmins() {
  const { client, db } = await connectToMongoDB();
  
  try {
    console.log('👥 Admin Users:');
    console.log('');
    
    const admins = await db.collection('users').find({
      $or: [
        { userType: 'SUPER_ADMIN' },
        { role: 'super_admin' },
        { role: 'admin' }
      ]
    }).toArray();

    if (admins.length === 0) {
      console.log('   No admin users found');
      return;
    }

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name || 'Unnamed'}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Type: ${admin.userType || admin.role}`);
      console.log(`   Active: ${admin.isActive ? '✅' : '❌'}`);
      console.log(`   Created: ${admin.createdAt?.toISOString() || 'Unknown'}`);
      console.log(`   Last Login: ${admin.lastLogin?.toISOString() || 'Never'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
  } finally {
    await client.close();
  }
}

/**
 * Reset admin password
 * @param {string} email - Admin email
 * @param {string} newPassword - New password
 */
async function resetPassword(email, newPassword) {
  const { client, db } = await connectToMongoDB();
  
  try {
    console.log(`🔐 Resetting password for ${email}...`);
    
    const hashedPassword = await hashPassword(newPassword);
    
    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
          loginAttempts: 0,
          isLocked: false,
          lockUntil: null
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('❌ User not found');
      return;
    }

    if (result.modifiedCount > 0) {
      console.log('✅ Password reset successfully!');
      console.log(`   Email: ${email}`);
      console.log(`   New Password: ${newPassword}`);
    } else {
      console.log('⚠️  Password was not changed');
    }
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await client.close();
  }
}

/**
 * Delete admin user
 * @param {string} email - Admin email
 */
async function deleteAdmin(email) {
  const { client, db } = await connectToMongoDB();
  
  try {
    console.log(`🗑️  Deleting admin ${email}...`);
    
    const result = await db.collection('users').deleteOne({ email });

    if (result.deletedCount > 0) {
      console.log('✅ Admin deleted successfully!');
    } else {
      console.log('❌ Admin not found');
    }
  } catch (error) {
    console.error('❌ Error deleting admin:', error.message);
  } finally {
    await client.close();
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log('🛠️  CigarUnderground Admin Manager');
  console.log('');
  console.log('Usage: node scripts/admin-manager.js [command] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  create [password]     Create super admin (default password: CigarAdmin2024!)');
  console.log('  list                  List all admin users');
  console.log('  reset <email> <pass>  Reset admin password');
  console.log('  delete <email>        Delete admin user');
  console.log('  help                  Show this help');
  console.log('');
  console.log('Options:');
  console.log('  --force              Force recreate if admin exists');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/admin-manager.js create');
  console.log('  node scripts/admin-manager.js create MySecurePassword123!');
  console.log('  node scripts/admin-manager.js list');
  console.log('  node scripts/admin-manager.js reset admin@cigarunderground.org NewPassword123!');
  console.log('  node scripts/admin-manager.js delete admin@cigarunderground.org');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {
    force: args.includes('--force')
  };

  switch (command) {
    case 'create':
      const password = args[1] || 'CigarAdmin2024!';
      await createSuperAdmin(password, options);
      break;
      
    case 'list':
      await listAdmins();
      break;
      
    case 'reset':
      if (args.length < 3) {
        console.log('❌ Usage: reset <email> <new-password>');
        process.exit(1);
      }
      await resetPassword(args[1], args[2]);
      break;
      
    case 'delete':
      if (args.length < 2) {
        console.log('❌ Usage: delete <email>');
        process.exit(1);
      }
      await deleteAdmin(args[1]);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log('❌ Unknown command:', command);
      console.log('');
      showHelp();
      process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

export { createSuperAdmin, listAdmins, resetPassword, deleteAdmin };