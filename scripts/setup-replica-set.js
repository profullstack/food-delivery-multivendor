// MongoDB Replica Set Initialization Script
print('Starting replica set initialization...');

try {
  // Initialize the replica set
  const result = rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'mongo1:27017', priority: 2 },
      { _id: 1, host: 'mongo2:27017', priority: 1 },
      { _id: 2, host: 'mongo3:27017', priority: 1 }
    ]
  });
  
  print('Replica set initiation result:', JSON.stringify(result));
  
  // Wait for replica set to be ready
  print('Waiting for replica set to be ready...');
  
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      const status = rs.status();
      const primary = status.members.find(member => member.stateStr === 'PRIMARY');
      
      if (primary) {
        print('Replica set is ready! Primary:', primary.name);
        break;
      }
      
      print('Waiting for primary... Attempt', attempts + 1);
      sleep(2000); // Wait 2 seconds
      attempts++;
    } catch (e) {
      print('Status check failed, retrying... Attempt', attempts + 1);
      sleep(2000);
      attempts++;
    }
  }
  
  if (attempts >= maxAttempts) {
    print('ERROR: Replica set failed to initialize within timeout');
    quit(1);
  }
  
  // Create the application database and user
  print('Creating application database and user...');
  
  const adminDb = db.getSiblingDB('admin');
  const appDb = db.getSiblingDB('enatega-multivendor');
  
  // Create application user
  try {
    adminDb.createUser({
      user: 'enatega-user',
      pwd: 'enatega-password-123',
      roles: [
        { role: 'readWrite', db: 'enatega-multivendor' },
        { role: 'dbAdmin', db: 'enatega-multivendor' }
      ]
    });
    print('Application user created successfully');
  } catch (e) {
    if (e.code === 51003) {
      print('Application user already exists');
    } else {
      print('Error creating application user:', e.message);
    }
  }
  
  // Create initial collections with indexes
  print('Setting up initial collections...');
  
  // Users collection
  appDb.users.createIndex({ email: 1 }, { unique: true });
  appDb.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
  appDb.users.createIndex({ userType: 1 });
  appDb.users.createIndex({ isActive: 1 });
  appDb.users.createIndex({ createdAt: -1 });
  
  // Age verification collection
  appDb.ageverifications.createIndex({ user: 1 }, { unique: true });
  appDb.ageverifications.createIndex({ status: 1 });
  appDb.ageverifications.createIndex({ submittedAt: -1 });
  appDb.ageverifications.createIndex({ expiryDate: 1 });
  appDb.ageverifications.createIndex({ 'document.documentType': 1 });
  
  // Food collection
  appDb.foods.createIndex({ title: 'text', description: 'text' });
  appDb.foods.createIndex({ restaurant: 1, isActive: 1, isAvailable: 1 });
  appDb.foods.createIndex({ category: 1, isActive: 1 });
  appDb.foods.createIndex({ isRestrictedItem: 1, restrictedItemType: 1 });
  appDb.foods.createIndex({ price: 1 });
  appDb.foods.createIndex({ rating: -1 });
  
  print('Database setup completed successfully!');
  
} catch (error) {
  print('ERROR during replica set setup:', error.message);
  quit(1);
}

print('Replica set initialization completed successfully!');