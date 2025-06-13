#!/usr/bin/env node

// Admin Manager Script - Create and manage admin users
import mongoose from 'mongoose'
import User from '../models/user.js'

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27020,localhost:27021,localhost:27022/cigarunderground?replicaSet=rs0'

// Default admin credentials
const DEFAULT_ADMIN = {
  email: 'admin@cigarunderground.org',
  password: 'CigarAdmin2024!',
  name: 'Super Admin',
  userType: 'SUPER_ADMIN',
  permissions: [
    'MANAGE_USERS',
    'MANAGE_STAFF',
    'MANAGE_ROLES',
    'MANAGE_PERMISSIONS',
    'MANAGE_RESTAURANTS',
    'MANAGE_VENDORS',
    'APPROVE_RESTAURANTS',
    'MANAGE_CATEGORIES',
    'MANAGE_CUISINES',
    'MANAGE_FOODS',
    'MANAGE_ADDONS',
    'VIEW_ALL_ORDERS',
    'MANAGE_ORDERS',
    'CANCEL_ORDERS',
    'VIEW_EARNINGS',
    'MANAGE_COMMISSION_RATES',
    'MANAGE_WITHDRAW_REQUESTS',
    'MANAGE_AGE_VERIFICATION',
    'APPROVE_AGE_VERIFICATION',
    'REJECT_AGE_VERIFICATION'
  ],
  isActive: true,
  isEmailVerified: true
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error.message)
  }
}

/**
 * Create super admin user
 */
async function createAdmin(password = null, force = false) {
  try {
    const adminData = { ...DEFAULT_ADMIN }
    if (password) {
      adminData.password = password
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email })
    
    if (existingAdmin && !force) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email)
      console.log('   Use --force flag to recreate')
      return existingAdmin
    }

    if (existingAdmin && force) {
      console.log('🔄 Removing existing admin user...')
      await User.deleteOne({ email: adminData.email })
    }

    // Create new admin
    console.log('🔧 Creating super admin user...')
    const admin = new User(adminData)
    await admin.save()

    console.log('✅ Super admin created successfully!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password:', adminData.password)
    console.log('👤 User Type:', admin.userType)
    console.log('🛡️  Permissions:', admin.permissions.length, 'permissions')
    console.log('')
    console.log('⚠️  IMPORTANT: Change the default password after first login!')

    return admin
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message)
    throw error
  }
}

/**
 * List all admin users
 */
async function listAdmins() {
  try {
    const admins = await User.find({ 
      userType: { $in: ['SUPER_ADMIN', 'RESTAURANT_ADMIN'] } 
    }).select('name email userType permissions isActive createdAt')

    if (admins.length === 0) {
      console.log('📭 No admin users found')
      return
    }

    console.log(`👥 Found ${admins.length} admin user(s):`)
    console.log('')

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`)
      console.log(`   📧 Email: ${admin.email}`)
      console.log(`   👤 Type: ${admin.userType}`)
      console.log(`   🛡️  Permissions: ${admin.permissions.length}`)
      console.log(`   ✅ Active: ${admin.isActive}`)
      console.log(`   📅 Created: ${admin.createdAt.toISOString()}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Failed to list admins:', error.message)
    throw error
  }
}

/**
 * Reset admin password
 */
async function resetPassword(email, newPassword) {
  try {
    const admin = await User.findOne({ email })
    
    if (!admin) {
      console.log('❌ Admin user not found:', email)
      return
    }

    admin.password = newPassword
    await admin.save()

    console.log('✅ Password reset successfully!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 New Password:', newPassword)
  } catch (error) {
    console.error('❌ Failed to reset password:', error.message)
    throw error
  }
}

/**
 * Delete admin user
 */
async function deleteAdmin(email) {
  try {
    const result = await User.deleteOne({ email })
    
    if (result.deletedCount === 0) {
      console.log('❌ Admin user not found:', email)
      return
    }

    console.log('✅ Admin user deleted successfully:', email)
  } catch (error) {
    console.error('❌ Failed to delete admin:', error.message)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const force = args.includes('--force')

  if (!command) {
    console.log('🔧 CigarUnderground Admin Manager')
    console.log('')
    console.log('Usage:')
    console.log('  node scripts/admin-manager.js create [password] [--force]')
    console.log('  node scripts/admin-manager.js list')
    console.log('  node scripts/admin-manager.js reset <email> <password>')
    console.log('  node scripts/admin-manager.js delete <email>')
    console.log('')
    console.log('Examples:')
    console.log('  node scripts/admin-manager.js create')
    console.log('  node scripts/admin-manager.js create "MySecurePassword123!"')
    console.log('  node scripts/admin-manager.js create --force')
    console.log('  node scripts/admin-manager.js list')
    console.log('  node scripts/admin-manager.js reset admin@cigarunderground.org "NewPassword123!"')
    console.log('  node scripts/admin-manager.js delete admin@cigarunderground.org')
    process.exit(0)
  }

  await connectDB()

  try {
    switch (command) {
      case 'create':
        const password = args[1] && !args[1].startsWith('--') ? args[1] : null
        await createAdmin(password, force)
        break

      case 'list':
        await listAdmins()
        break

      case 'reset':
        if (args.length < 3) {
          console.log('❌ Usage: reset <email> <password>')
          process.exit(1)
        }
        await resetPassword(args[1], args[2])
        break

      case 'delete':
        if (args.length < 2) {
          console.log('❌ Usage: delete <email>')
          process.exit(1)
        }
        await deleteAdmin(args[1])
        break

      default:
        console.log('❌ Unknown command:', command)
        console.log('Available commands: create, list, reset, delete')
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message)
    process.exit(1)
  } finally {
    await disconnectDB()
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message)
  process.exit(1)
})