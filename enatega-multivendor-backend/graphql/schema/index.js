// GraphQL Schema - Main Type Definitions
import { gql } from 'graphql-tag'

const typeDefs = gql`
  # Scalar types
  scalar Date
  scalar Upload

  # Basic types
  type Query {
    # Health check query
    health: HealthStatus!
    
    # User queries
    me: User
    users: [User!]!
    
    # Food queries
    foods: [Food!]!
    food(id: ID!): Food
    
    # Restaurant queries
    restaurants: [Restaurant!]!
    restaurant(id: ID!): Restaurant
    
    # Order queries
    orders: [Order!]!
    order(id: ID!): Order
  }

  type Mutation {
    # Authentication
    login(email: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    
    # User mutations
    updateProfile(input: UpdateProfileInput!): User!
    
    # Age verification
    verifyAge(input: AgeVerificationInput!): AgeVerificationResult!
    
    # Order mutations
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
  }

  type Subscription {
    # Order subscriptions
    orderStatusChanged(orderId: ID!): Order!
    newOrder: Order!
    
    # Real-time notifications
    notification(userId: ID!): Notification!
  }

  # Health Status
  type HealthStatus {
    status: String!
    timestamp: String!
    version: String!
    database: DatabaseStatus!
  }

  type DatabaseStatus {
    connected: Boolean!
    readyState: Int!
    readyStateText: String!
  }

  # Authentication
  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    phone: String
    dateOfBirth: Date
  }

  input UpdateProfileInput {
    name: String
    phone: String
    address: String
  }

  # Age Verification
  type AgeVerificationResult {
    verified: Boolean!
    expiresAt: Date
    message: String
  }

  input AgeVerificationInput {
    userId: ID!
    dateOfBirth: Date!
    documentType: String
    documentNumber: String
  }

  # User
  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    address: String
    dateOfBirth: Date
    ageVerified: Boolean!
    ageVerificationExpiry: Date
    createdAt: Date!
    updatedAt: Date!
  }

  # Food
  type Food {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: String!
    image: String
    restaurant: Restaurant!
    available: Boolean!
    ageRestricted: Boolean!
    minimumAge: Int
    createdAt: Date!
    updatedAt: Date!
  }

  # Restaurant
  type Restaurant {
    id: ID!
    name: String!
    description: String
    address: String!
    phone: String
    email: String
    image: String
    rating: Float
    isActive: Boolean!
    foods: [Food!]!
    createdAt: Date!
    updatedAt: Date!
  }

  # Order
  type Order {
    id: ID!
    user: User!
    restaurant: Restaurant!
    items: [OrderItem!]!
    status: OrderStatus!
    total: Float!
    deliveryAddress: String!
    notes: String
    createdAt: Date!
    updatedAt: Date!
  }

  type OrderItem {
    id: ID!
    food: Food!
    quantity: Int!
    price: Float!
    specialInstructions: String
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    PREPARING
    READY
    OUT_FOR_DELIVERY
    DELIVERED
    CANCELLED
  }

  input CreateOrderInput {
    restaurantId: ID!
    items: [OrderItemInput!]!
    deliveryAddress: String!
    notes: String
  }

  input OrderItemInput {
    foodId: ID!
    quantity: Int!
    specialInstructions: String
  }

  # Notifications
  type Notification {
    id: ID!
    userId: ID!
    title: String!
    message: String!
    type: NotificationType!
    read: Boolean!
    createdAt: Date!
  }

  enum NotificationType {
    ORDER_UPDATE
    PROMOTION
    SYSTEM
    AGE_VERIFICATION
  }
`

export default typeDefs