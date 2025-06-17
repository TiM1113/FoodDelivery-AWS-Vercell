# ⚡ DEPLOYMENT OPTIMIZATION GUIDE

## Performance Optimizations

### Backend Optimizations

#### 1. Add Compression Middleware
```javascript
// Add to server.js
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

#### 2. Optimize Database Queries
```javascript
// Use lean() for read-only queries
const foods = await foodModel.find({}).lean();

// Add indexes to frequently queried fields
// In MongoDB Atlas or via code:
foodModel.collection.createIndex({ category: 1 });
foodModel.collection.createIndex({ name: "text", description: "text" });
```

#### 3. Implement Caching
```javascript
// Add to foodController.js
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const listFood = async (req, res) => {
  const cacheKey = 'food_list';
  const cached = cache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return res.json(cached.data);
  }
  
  try {
    const foods = await foodModel.find({}).lean();
    const result = { success: true, data: foods };
    
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Frontend Optimizations

#### 1. Optimized Vite Configuration
**Already updated** in `frontend/vite.config.js`:
- Code splitting for vendor libraries
- Chunk size optimization
- Bundle analysis ready

#### 2. Image Optimization
```javascript
// Add to FoodItem component
const FoodItem = ({id, name, price, description, image}) => {
  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          src={image}
          alt={name}
          className="food-item-image"
          loading="lazy" // Add lazy loading
          onError={(e) => {
            e.target.src = food_1; // Fallback image
          }}
        />
      </div>
    </div>
  );
};
```

#### 3. React Performance Optimization
```javascript
// Add to StoreContext.jsx
import { createContext, useEffect, useState, useCallback, useMemo } from 'react';

// Memoize expensive calculations
const getTotalCartAmount = useMemo(() => {
  let totalAmount = 0;
  if (!food_list || !food_list.length || !cartItems) return 0;
  
  Object.entries(cartItems).forEach(([itemId, quantity]) => {
    if (quantity > 0) {
      const itemInfo = food_list.find(product => product._id === itemId);
      if (itemInfo && itemInfo.price) {
        totalAmount += itemInfo.price * quantity;
      }
    }
  });
  
  return totalAmount;
}, [food_list, cartItems]);
```

### Database Optimizations

#### 1. MongoDB Indexing Strategy
```javascript
// Create indexes for better query performance
db.foods.createIndex({ "category": 1 })
db.foods.createIndex({ "name": "text", "description": "text" })
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "status": 1 })
db.users.createIndex({ "email": 1 }, { unique: true })
```

#### 2. Connection Pool Optimization
```javascript
// In db.js
const conn = await mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  maxPoolSize: 50, // Increased pool size
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

## Security Enhancements

### 1. Add Security Headers
```javascript
// Add to server.js
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS for HTTPS
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
});
```

### 2. Rate Limiting Implementation
```javascript
// Install: npm install express-rate-limit
import rateLimit from 'express-rate-limit';

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login attempts
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);
```

### 3. Input Validation & Sanitization
```javascript
// Install: npm install express-validator
import { body, validationResult } from 'express-validator';

// Validation middleware
export const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 50 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
```

## Monitoring & Analytics

### 1. Request Logging
```javascript
// Add to server.js
import morgan from 'morgan';

// Custom log format
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  skip: (req, res) => process.env.NODE_ENV === 'test'
}));
```

### 2. Error Tracking
```javascript
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent')
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});
```

### 3. Health Check Endpoint
```javascript
// Enhanced health check
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      s3: 'unknown'
    }
  };
  
  try {
    // Check database
    await mongoose.connection.db.admin().ping();
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
  }
  
  res.status(200).json(health);
});
```

## Deployment Configuration

### 1. Optimized Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js",
      "headers": {
        "Cache-Control": "s-maxage=1, stale-while-revalidate=59"
      }
    }
  ],
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. Environment-Specific Configurations
```javascript
// config/environments.js
const environments = {
  development: {
    database: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    },
    cache: {
      ttl: 60000 // 1 minute
    }
  },
  production: {
    database: {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 10000
    },
    cache: {
      ttl: 300000 // 5 minutes
    }
  }
};

export default environments[process.env.NODE_ENV || 'development'];
```

## CDN & Asset Optimization

### 1. Image Optimization
```javascript
// S3 image optimization
const optimizeImageUrl = (imageUrl, width = 400, quality = 80) => {
  // If using AWS CloudFront with image optimization
  if (imageUrl.includes('s3.amazonaws.com')) {
    return `${imageUrl}?w=${width}&q=${quality}`;
  }
  return imageUrl;
};
```

### 2. Static Asset Caching
```javascript
// Add cache headers for static assets
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));
```

## Testing Optimizations

### 1. Performance Testing
```bash
# Load testing with artillery
npm install -g artillery
echo "config:
  target: 'https://backend-ten-azure-58.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'API Load Test'
    requests:
      - get:
          url: '/api/food/list'" > load-test.yml

artillery run load-test.yml
```

### 2. Bundle Analysis
```bash
# Frontend bundle analysis
npm run build
npx vite-bundle-analyzer dist
```

This comprehensive optimization guide will significantly improve your application's performance, security, and maintainability!