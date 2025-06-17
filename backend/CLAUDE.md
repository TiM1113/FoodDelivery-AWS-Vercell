# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js/Express REST API backend for a food delivery application, designed to run as serverless functions on Vercel. The backend handles authentication, food management, cart operations, and order processing with payment integration.

## Development Commands

```bash
npm run dev      # Development server with nodemon
npm start        # Production server
npm test         # Run environment and connection tests
npm run build    # Install dependencies (alias for npm install)
npm install      # Install project dependencies
```

## Architecture

### Core Technologies
- **Runtime**: Node.js (>=14.0.0) with ES modules
- **Framework**: Express.js 4.21.1
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: AWS S3 with multer (memory storage)
- **Payment Processing**: Stripe integration
- **Deployment**: Vercel serverless functions

### Project Structure
```
backend/
├── api/index.js          # Vercel serverless entry point
├── server.js             # Main Express application
├── config/db.js          # MongoDB connection with caching
├── models/               # Mongoose schemas
│   ├── foodModel.js      # Food items schema
│   ├── userModel.js      # User accounts schema
│   └── orderModel.js     # Order management schema
├── controllers/          # Business logic handlers
│   ├── foodController.js # Food CRUD operations
│   ├── userController.js # Authentication logic
│   ├── cartController.js # Cart management
│   └── orderController.js# Order processing & Stripe
├── routes/               # Express route definitions
│   ├── foodRoute.js      # Food endpoints with file upload
│   ├── userRoute.js      # Auth endpoints
│   ├── cartRoute.js      # Cart operations (protected)
│   └── orderRoute.js     # Order management
├── middleware/auth.js    # JWT authentication middleware
├── scripts/migrateImages.js # S3 migration utility
├── test.js              # Environment setup validation
└── uploads/             # Legacy local uploads (not used)
```

## Database Schema

### Food Model
```javascript
{
  name: String (required),
  description: String (required),
  price: Number (required),
  image: String (required), // S3 URL
  category: String (required)
}
```

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required), // bcrypt hashed
  cartData: Object (default: {}) // item_id: quantity mapping
}
```

### Order Model
```javascript
{
  userId: String (required),
  items: Array (required),      // Cart items array
  amount: Number (required),    // Total amount
  address: Object (required),   // Delivery address
  status: String (default: "Food Processing"),
  date: Date (default: Date.now),
  payment: Boolean (default: false)
}
```

## API Endpoints

### Authentication
- `POST /api/user/register` - User registration with email validation
- `POST /api/user/login` - User login with JWT token generation

### Food Management
- `POST /api/food/add` - Add food item with S3 image upload
- `GET /api/food/list` - Get all food items
- `POST /api/food/remove` - Remove food item by ID

### Cart Operations (Protected Routes)
- `POST /api/cart/add` - Add item to user cart
- `POST /api/cart/remove` - Remove item from user cart
- `POST /api/cart/get` - Get user's current cart

### Order Management
- `POST /api/order/place` - Place order with Stripe payment (protected)
- `POST /api/order/verify` - Verify Stripe payment status
- `GET /api/order/verify` - Alternative verify endpoint
- `POST /api/order/userorders` - Get user's order history (protected)
- `GET /api/order/list` - Get all orders (admin endpoint)
- `POST /api/order/update` - Update order status (admin)

## Environment Configuration

Required environment variables:
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_jwt_secret_key

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name

# Payment Processing
STRIPE_SECRET_KEY=sk_test_or_live_key

# Optional
NODE_ENV=development|production
```

## Key Implementation Details

### Serverless Architecture
- **Entry Point**: `api/index.js` exports the Express app for Vercel
- **Memory Storage**: Multer configured for memory storage (Vercel requirement)
- **Connection Caching**: MongoDB connections cached for serverless efficiency
- **CORS Configuration**: Specific allowed origins for production domains

### Authentication Flow
- JWT tokens stored in client localStorage
- `auth.js` middleware validates tokens on protected routes
- Token includes user ID for cart/order operations
- Bcrypt used for password hashing with salt rounds

### File Upload System
- **Current**: Multer memory storage → AWS S3 upload → MongoDB URL storage
- **Legacy**: Local uploads directory exists but unused
- **Migration**: `scripts/migrateImages.js` for S3 migration
- **Limits**: 5MB file size limit configured

### Error Handling
- Global error middleware with environment-specific error details
- Comprehensive logging for debugging
- Graceful MongoDB connection error handling

## Development Workflow

1. **Environment Setup**: Copy required environment variables
2. **Testing**: Run `npm test` to validate configuration
3. **Local Development**: Use `npm run dev` with nodemon
4. **Database**: Uses cached connections for efficiency
5. **File Storage**: All images uploaded to AWS S3
6. **Payment Testing**: Use Stripe test keys for development

## Common Issues & Solutions

### MongoDB Connection
- Uses connection caching to prevent timeouts in serverless
- Handles database name changes and reconnection
- 10-second timeout configured for serverless constraints

### File Uploads
- Memory storage required for Vercel (not disk storage)
- 5MB file size limit to prevent memory issues
- Legacy uploads directory exists but not used in production

### Authentication Middleware
- Token expected in request headers as `token` field
- User ID extracted from JWT and added to request body
- Middleware validates JWT tokens on protected routes

### CORS Configuration
- Specific allowed origins for production deployment
- Credentials enabled for authentication
- Request logging middleware for debugging

## Testing

- **Setup Validation**: `npm test` checks environment variables, MongoDB connection, and AWS configuration
- **Manual Testing**: No automated test suite configured
- **Health Check**: GET `/` endpoint provides API status and version info

## Migration Scripts

- `scripts/migrateImages.js` - Utility for migrating local images to S3
- Handles bulk upload of existing images from uploads directory