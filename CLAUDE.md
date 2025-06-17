# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack MERN food delivery application with three main components:
- **Backend**: Node.js/Express API (deployed on Vercel as serverless functions)
- **Frontend**: React customer application (deployed on Vercel)
- **Admin**: React admin panel (deployed on Vercel)

## Development Commands

### Backend (`/backend/`)
```bash
npm run dev      # Development server with nodemon
npm start        # Production server
npm test         # Run tests
npm run build    # Install dependencies
```

### Frontend (`/frontend/`) and Admin (`/admin/`)
```bash
npm run dev      # Development server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint with ./node_modules/.bin/eslint .
```

### Linting
- Run ESLint using: `./node_modules/.bin/eslint .` from respective directories
- Frontend uses React 17+ (no React import needed for JSX)
- PropTypes validation is implemented for all components

## Architecture

### Backend Structure
- **Entry Point**: `api/index.js` (Vercel serverless entry)
- **Models**: MongoDB with Mongoose (User, Food, Order)
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 (migrated from local uploads)
- **Payment**: Stripe integration with AUD currency
- **API Base**: `https://backend-ten-azure-58.vercel.app`

### Frontend Structure
- **State Management**: React Context API (`StoreContext`)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Build Tool**: Vite with Fast Refresh
- **Frontend URL**: `https://frontend-beige-eight-62.vercel.app`

### Admin Structure
- **Similar to Frontend**: React + Vite + React Router DOM v7
- **Notifications**: React Toastify
- **Admin URL**: `https://admin-kappa-ivory.vercel.app`

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
  cartData: Object (default: {}) // item_id: quantity
}
```

### Order Model
```javascript
{
  userId: String (required),
  items: Array (required),
  amount: Number (required),
  address: Object (required),
  status: String (default: "Food Processing"),
  payment: Boolean (default: false)
}
```

## API Endpoints

### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login

### Food Management
- `POST /api/food/add` - Add food item (with S3 image upload)
- `GET /api/food/list` - Get all food items
- `POST /api/food/remove` - Remove food item

### Cart Operations (Authenticated)
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `POST /api/cart/get` - Get user's cart

### Order Management
- `POST /api/order/place` - Place order with Stripe payment
- `POST /api/order/verify` - Verify payment status
- `POST /api/order/userorders` - Get user's orders (authenticated)
- `GET /api/order/list` - Get all orders (admin)
- `POST /api/order/update` - Update order status (admin)

## Environment Configuration

### Backend Environment Variables
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-2
S3_BUCKET_NAME=food-delivery-images-bucket
```

### Frontend/Admin Environment Variables (Vite)
```
VITE_API_URL=https://backend-ten-azure-58.vercel.app
VITE_S3_URL=https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com
```

## Key Implementation Details

### File Upload Architecture
- **Current**: Multer memory storage → AWS S3 upload → MongoDB URL storage
- **Previous**: Local file storage (legacy uploads/ directory exists)
- **Migration Script**: `backend/scripts/migrateImages.js`

### Authentication Flow
- JWT tokens stored in localStorage
- `auth.js` middleware validates tokens on protected routes
- User registration includes email validation

### State Management (Frontend)
- **StoreContext**: Centralized state for food list, cart, user auth
- **Cart Operations**: Optimistic updates with server sync
- **API Integration**: Axios with base URL configuration

### Deployment Architecture
- **Vercel Serverless**: Backend runs as serverless functions via `api/index.js`
- **Static Hosting**: Frontend and Admin as static sites
- **CORS Configuration**: Specific to deployment domains
- **S3 Integration**: Direct URL access with proper CORS setup

## Development Workflow

1. **Local Development**: Each component runs independently
2. **API Testing**: Use deployed backend URLs in development
3. **Database**: Shared MongoDB Atlas instance
4. **File Storage**: AWS S3 bucket for all environments
5. **Deployment**: Individual Vercel deployments with environment-specific configurations

## Common Issues

### Linting
- Use full path to ESLint: `./node_modules/.bin/eslint .`
- React imports not needed for JSX (React 17+)
- PropTypes required for all component props

### Environment Variables
- Frontend/Admin use `import.meta.env.VITE_*` (not `process.env`)
- Backend uses `process.env.*` with dotenv

### File Uploads
- Vercel requires memory storage (not disk storage)
- Images stored in AWS S3, URLs in MongoDB
- Legacy local uploads directory exists but not used

## Testing

- Backend: `npm test` runs `test.js`
- Frontend/Admin: No specific test scripts configured
- Manual testing recommended for full functionality