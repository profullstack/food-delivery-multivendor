// scripts/setup-replica-set.js - MongoDB replica set initialization
// This script initializes a MongoDB replica set for the CigarUnderground application

const config = {
  _id: 'rs0',
  members: [
    {
      _id: 0,
      host: 'mongo1:27017',
      priority: 2
    },
    {
      _id: 1,
      host: 'mongo2:27017',
      priority: 1
    },
    {
      _id: 2,
      host: 'mongo3:27017',
      priority: 1
    }
  ]
}

try {
  console.log('🔄 Initializing MongoDB replica set...')
  
  // Check if replica set is already initialized
  try {
    const status = rs.status()
    console.log('✅ Replica set already initialized:', status.set)
    console.log('📊 Current members:', status.members.length)
    quit(0)
  } catch (error) {
    // Replica set not initialized, proceed with initialization
    console.log('📝 Replica set not initialized, proceeding with setup...')
  }
  
  // Initialize the replica set
  const result = rs.initiate(config)
  
  if (result.ok === 1) {
    console.log('✅ Replica set initialized successfully')
    console.log('📋 Configuration:', JSON.stringify(config, null, 2))
    
    // Wait for the replica set to become ready
    console.log('⏳ Waiting for replica set to become ready...')
    
    let attempts = 0
    const maxAttempts = 30
    
    while (attempts < maxAttempts) {
      try {
        const status = rs.status()
        const primary = status.members.find(member => member.stateStr === 'PRIMARY')
        
        if (primary) {
          console.log('✅ Replica set is ready with primary:', primary.name)
          break
        }
        
        console.log(`⏳ Waiting for primary... (attempt ${attempts + 1}/${maxAttempts})`)
        sleep(2000) // Wait 2 seconds
        attempts++
        
      } catch (statusError) {
        console.log(`⏳ Replica set still initializing... (attempt ${attempts + 1}/${maxAttempts})`)
        sleep(2000)
        attempts++
      }
    }
    
    if (attempts >= maxAttempts) {
      console.error('❌ Timeout waiting for replica set to become ready')
      quit(1)
    }
    
    // Create initial database and user if needed
    try {
      console.log('🔄 Setting up initial database...')
      
      // Switch to the application database
      const db = db.getSiblingDB('cigarunderground')
      
      // Create a test collection to ensure database exists
      db.createCollection('_init')
      console.log('✅ Database initialized')
      
      // Create indexes for common queries (optional)
      console.log('🔄 Creating initial indexes...')
      
      // You can add index creation here if needed
      // db.users.createIndex({ email: 1 }, { unique: true })
      // db.orders.createIndex({ createdAt: -1 })
      
      console.log('✅ Setup completed successfully')
      
    } catch (dbError) {
      console.warn('⚠️ Database setup warning:', dbError.message)
      // Don't fail the entire setup for database warnings
    }
    
  } else {
    console.error('❌ Failed to initialize replica set:', result)
    quit(1)
  }
  
} catch (error) {
  console.error('❌ Error during replica set setup:', error.message)
  console.error('Stack trace:', error.stack)
  quit(1)
}

console.log('🎉 MongoDB replica set setup completed successfully!')
quit(0)