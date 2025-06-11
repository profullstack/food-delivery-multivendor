// MongoDB initialization script for Docker deployment
// This script runs when MongoDB container starts for the first time

print('Starting MongoDB initialization...');

// Switch to the enatega-multivendor database
db = db.getSiblingDB('enatega-multivendor');

// Create application user with read/write permissions
db.createUser({
  user: 'enatega_user',
  pwd: 'enatega_password_2024',
  roles: [
    {
      role: 'readWrite',
      db: 'enatega-multivendor'
    }
  ]
});

print('Created application user: enatega_user');

// Create collections with validation schemas
print('Creating collections with validation...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password'],
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
        phone: {
          bsonType: 'string',
          description: 'must be a string'
        },
        name: {
          bsonType: 'string',
          description: 'must be a string'
        },
        dateOfBirth: {
          bsonType: 'date',
          description: 'must be a date'
        },
        isAgeVerified: {
          bsonType: 'bool',
          description: 'must be a boolean'
        },
        ageVerificationStatus: {
          bsonType: 'string',
          enum: ['pending', 'approved', 'rejected', 'expired'],
          description: 'must be one of the enum values'
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

// Age verifications collection
db.createCollection('ageverifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'documentType', 'status'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId'
        },
        documentType: {
          bsonType: 'string',
          enum: ['drivers_license', 'passport', 'state_id', 'military_id'],
          description: 'must be one of the enum values'
        },
        documentImages: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['url', 'publicId'],
            properties: {
              url: {
                bsonType: 'string',
                description: 'must be a string'
              },
              publicId: {
                bsonType: 'string',
                description: 'must be a string'
              }
            }
          },
          description: 'must be an array of image objects'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'approved', 'rejected', 'expired'],
          description: 'must be one of the enum values'
        },
        reviewedBy: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId'
        },
        reviewedAt: {
          bsonType: 'date',
          description: 'must be a date'
        },
        rejectionReason: {
          bsonType: 'string',
          description: 'must be a string'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'must be a date'
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

// Foods collection
db.createCollection('foods', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'price'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'must be a string'
        },
        description: {
          bsonType: 'string',
          description: 'must be a string'
        },
        price: {
          bsonType: 'number',
          minimum: 0,
          description: 'must be a positive number'
        },
        isAgeRestricted: {
          bsonType: 'bool',
          description: 'must be a boolean'
        },
        ageRestrictionType: {
          bsonType: 'string',
          enum: ['tobacco', 'alcohol', 'other'],
          description: 'must be one of the enum values'
        },
        minimumAge: {
          bsonType: 'int',
          minimum: 18,
          maximum: 25,
          description: 'must be an integer between 18 and 25'
        },
        category: {
          bsonType: 'string',
          description: 'must be a string'
        },
        restaurant: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId'
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

print('Collections created successfully');

// Create indexes for performance
print('Creating indexes...');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
db.users.createIndex({ isAgeVerified: 1, ageVerificationStatus: 1 });
db.users.createIndex({ createdAt: 1 });

// Age verifications indexes
db.ageverifications.createIndex({ userId: 1 });
db.ageverifications.createIndex({ status: 1 });
db.ageverifications.createIndex({ userId: 1, status: 1 });
db.ageverifications.createIndex({ createdAt: 1 });
db.ageverifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.ageverifications.createIndex({ reviewedBy: 1 });

// Foods indexes
db.foods.createIndex({ restaurant: 1 });
db.foods.createIndex({ category: 1 });
db.foods.createIndex({ isAgeRestricted: 1 });
db.foods.createIndex({ isAgeRestricted: 1, ageRestrictionType: 1 });
db.foods.createIndex({ title: 'text', description: 'text' });

print('Indexes created successfully');

// Insert sample data for testing
print('Inserting sample data...');

// Sample restaurant (if restaurants collection exists)
try {
  db.restaurants.insertOne({
    _id: ObjectId('507f1f77bcf86cd799439011'),
    name: 'Sample Restaurant',
    description: 'A sample restaurant for testing',
    address: '123 Main St, City, State',
    phone: '+1234567890',
    email: 'restaurant@example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Sample restaurant inserted');
} catch (e) {
  print('Restaurants collection may not exist yet, skipping sample restaurant');
}

// Sample food items
db.foods.insertMany([
  {
    title: 'Regular Burger',
    description: 'A delicious regular burger',
    price: 12.99,
    isAgeRestricted: false,
    category: 'burgers',
    restaurant: ObjectId('507f1f77bcf86cd799439011'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Beer - IPA',
    description: 'Craft IPA beer',
    price: 6.99,
    isAgeRestricted: true,
    ageRestrictionType: 'alcohol',
    minimumAge: 21,
    category: 'beverages',
    restaurant: ObjectId('507f1f77bcf86cd799439011'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Cigarettes - Marlboro',
    description: 'Pack of Marlboro cigarettes',
    price: 8.99,
    isAgeRestricted: true,
    ageRestrictionType: 'tobacco',
    minimumAge: 21,
    category: 'tobacco',
    restaurant: ObjectId('507f1f77bcf86cd799439011'),
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Sample food items inserted');

// Create admin user for age verification reviews
db.users.insertOne({
  email: 'admin@enatega.com',
  password: '$2b$10$rQZ8kJZjZjZjZjZjZjZjZeJ8kJZjZjZjZjZjZjZjZjZjZjZjZjZjZj', // hashed 'admin123'
  name: 'Admin User',
  phone: '+1234567890',
  role: 'admin',
  isAgeVerified: true,
  ageVerificationStatus: 'approved',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Admin user created');

print('MongoDB initialization completed successfully!');
print('Database: enatega-multivendor');
print('User: enatega_user');
print('Collections: users, ageverifications, foods');
print('Sample data inserted for testing');