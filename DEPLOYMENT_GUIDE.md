# 🚀 VERCEL DEPLOYMENT GUIDE

## STEP 1: Environment Variables Setup

### Backend Environment Variables (Vercel Dashboard)

**Go to**: Vercel Dashboard → backend-ten-azure-58 → Settings → Environment Variables

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/fooddelivery

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-32-chars

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# For production: sk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA***************
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-southeast-2
AWS_BUCKET_NAME=food-delivery-images-bucket

# Node Environment
NODE_ENV=production
```

### Frontend Environment Variables (Vercel Dashboard)

**Go to**: Vercel Dashboard → frontend-beige-eight-62 → Settings → Environment Variables

```bash
# API Configuration
VITE_API_URL=https://backend-ten-azure-58.vercel.app
VITE_S3_URL=https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com
```

### Admin Environment Variables (Vercel Dashboard)

**Go to**: Vercel Dashboard → admin-kappa-ivory → Settings → Environment Variables

```bash
# API Configuration  
VITE_API_URL=https://backend-ten-azure-58.vercel.app
VITE_S3_URL=https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com
```

## STEP 2: Troubleshooting Common Deployment Issues

### Issue 1: Build Failures

**Backend Build Issues:**
```bash
# Check if all dependencies are in package.json
npm install
npm run build

# Common fixes:
# - Ensure all imports use .js extensions
# - Check for missing dependencies
# - Verify Node.js version compatibility
```

**Frontend/Admin Build Issues:**
```bash
# Check Vite configuration
npm run build

# Common fixes:
# - Ensure environment variables start with VITE_
# - Check for TypeScript errors
# - Verify React component syntax
```

### Issue 2: CORS Errors

**Already configured in server.js, but verify:**
```javascript
const allowedOrigins = [
  'https://admin-kappa-ivory.vercel.app',
  'https://frontend-beige-eight-62.vercel.app', 
  'https://backend-ten-azure-58.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];
```

### Issue 3: Database Connection

**MongoDB Connection Troubleshooting:**
```bash
# Test connection string format:
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Common fixes:
# - Ensure password doesn't contain special characters
# - Check IP whitelist in MongoDB Atlas
# - Verify database name exists
```

### Issue 4: Environment Variables Not Loading

**Vercel Env Var Setup:**
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable with Production scope
5. Redeploy after adding variables

## STEP 3: Testing Deployed Applications

### Backend API Testing

**Health Check:**
```bash
curl https://backend-ten-azure-58.vercel.app/
# Expected: {"status":"API Working","version":"1.0.0"}
```

**Food List API:**
```bash
curl https://backend-ten-azure-58.vercel.app/api/food/list
# Expected: {"success":true,"data":[...],"count":number}
```

**User Registration Test:**
```bash
curl -X POST https://backend-ten-azure-58.vercel.app/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpassword123"}'
# Expected: {"success":true,"token":"..."}
```

### Frontend Testing Checklist

**Visit**: https://frontend-beige-eight-62.vercel.app

- [ ] Home page loads correctly
- [ ] Food items display with images
- [ ] User registration works
- [ ] User login works
- [ ] Add to cart functionality
- [ ] Order placement flow
- [ ] Payment integration (test mode)

### Admin Testing Checklist

**Visit**: https://admin-kappa-ivory.vercel.app

- [ ] Admin login page loads
- [ ] Food management (add/remove/list)
- [ ] Order management
- [ ] Image upload functionality

## STEP 4: Deployment Optimization

### Performance Optimizations

**Backend Optimizations:**
```javascript
// Add to server.js
import compression from 'compression';
app.use(compression());

// Optimize MongoDB queries
const foods = await foodModel.find({}).lean(); // Use lean() for read-only
```

**Frontend Optimizations:**
```javascript
// Add to vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
});
```

### Security Enhancements (Post-Deployment)

**Add Security Headers:**
```javascript
// Add to server.js
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

### Monitoring Setup

**Backend Logging:**
```javascript
// Enhanced logging for production
console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
```

**Error Tracking:**
- Set up Vercel Analytics
- Monitor function execution times
- Track API response times

## Quick Deployment Commands

```bash
# Deploy all three components
cd backend && vercel --prod
cd ../frontend && vercel --prod  
cd ../admin && vercel --prod
```

## Environment Variables Template

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fooddelivery
JWT_SECRET=your-jwt-secret-at-least-32-characters-long
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-southeast-2
AWS_BUCKET_NAME=food-delivery-images-bucket
NODE_ENV=production
```

### Frontend (.env)
```env
VITE_API_URL=https://backend-ten-azure-58.vercel.app
VITE_S3_URL=https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com
```

### Admin (.env)
```env
VITE_API_URL=https://backend-ten-azure-58.vercel.app
VITE_S3_URL=https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com
```

## Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] MongoDB Atlas IP whitelist includes 0.0.0.0/0 for Vercel
- [ ] AWS S3 bucket permissions configured
- [ ] Stripe account configured with proper keys
- [ ] DNS/domain configuration (if using custom domain)
- [ ] All three applications deployed successfully
- [ ] Cross-application connectivity tested
- [ ] Payment flow tested in test mode