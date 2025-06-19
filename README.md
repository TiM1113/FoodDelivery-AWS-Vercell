# Food Delivery Application

A full-stack MERN food delivery application with three main components: customer frontend, admin panel, and backend API. The application is deployed on Vercel and uses MongoDB as the database and AWS S3 for image storage.

## 🚀 Live Demo

- **Customer App**: [https://fooddelivery-2025.vercel.app](https://fooddelivery-2025.vercel.app)
- **Admin Panel**: [https://admin-kappa-ivory.vercel.app](https://admin-kappa-ivory.vercel.app)
- **Backend API**: [https://backend-ten-azure-58.vercel.app](https://backend-ten-azure-58.vercel.app)

## 🛠️ Tech Stack

### Frontend (Customer App)
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Styling**: CSS3
- **Deployment**: Vercel

### Backend (API)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **File Storage**: AWS S3
- **Payment**: Stripe
- **Deployment**: Vercel (Serverless Functions)

### Admin Panel
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM v7
- **Notifications**: React Toastify
- **Styling**: CSS3
- **Deployment**: Vercel

## 🏗️ Project Structure

```
├── frontend/          # Customer-facing React app
├── admin/            # Admin panel React app
├── backend/          # Node.js Express API
├── CLAUDE.md         # Development instructions
└── README.md         # This file
```

## 🔑 Key Features

### Customer App
- Browse food items by category
- Add/remove items to/from cart
- User authentication (register/login)
- Place orders with Stripe payment
- View order history
- Responsive design

### Admin Panel
- Add/edit/delete food items
- View and manage all orders
- Update order status
- Image upload to AWS S3
- Real-time order notifications

### Backend API
- RESTful API endpoints
- JWT authentication
- MongoDB data persistence with Mongoose
- File upload to AWS S3
- Stripe payment integration
- Serverless deployment

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 14.0.0)
- MongoDB Atlas account
- AWS S3 bucket
- Stripe account

### Environment Variables

Create `.env` files in the backend directory:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_jwt_secret_key

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name

# Payment
STRIPE_SECRET_KEY=sk_test_or_live_key
```

For frontend and admin, create `.env` files:

```bash
VITE_API_URL=https://backend-ten-azure-58.vercel.app
VITE_S3_URL=https://your-bucket-name.s3.your-region.amazonaws.com
```

### Installation & Development

1. **Backend**
```bash
cd backend
npm install
npm run dev
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Admin**
```bash
cd admin
npm install
npm run dev
```

## 📡 API Endpoints

### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login

### Food Management
- `POST /api/food/add` - Add food item (with image upload)
- `GET /api/food/list` - Get all food items
- `POST /api/food/remove` - Remove food item

### Cart Operations
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `POST /api/cart/get` - Get user's cart

### Order Management
- `POST /api/order/place` - Place order with payment
- `POST /api/order/verify` - Verify payment status
- `POST /api/order/userorders` - Get user's orders
- `GET /api/order/list` - Get all orders (admin)
- `POST /api/order/update` - Update order status

## 🎨 Screenshots

The application includes:
- Modern, responsive design
- Intuitive user interface
- Real-time order tracking
- Secure payment processing
- Comprehensive admin dashboard

## 🔧 Deployment

The application is deployed using Vercel:

1. **Frontend & Admin**: Static site deployment
2. **Backend**: Serverless functions deployment
3. **Database**: MongoDB Atlas cloud database
4. **Storage**: AWS S3
5. **Payments**: Stripe

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For any questions or support, please contact the project maintainer.