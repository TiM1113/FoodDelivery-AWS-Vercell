# 🧪 DEPLOYMENT TESTING GUIDE

## Automated Testing Scripts

### Complete Application Test
```bash
#!/bin/bash
# test-full-deployment.sh

echo "🧪 Starting Full Deployment Test..."

BACKEND_URL="https://backend-ten-azure-58.vercel.app"
FRONTEND_URL="https://frontend-beige-eight-62.vercel.app"
ADMIN_URL="https://admin-kappa-ivory.vercel.app"

# Test Backend
echo "📡 Testing Backend..."
backend_health=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/)
if [ $backend_health -eq 200 ]; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed (HTTP $backend_health)"
fi

# Test Food API
food_api=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/food/list)
if [ $food_api -eq 200 ]; then
    echo "✅ Food API working"
else
    echo "❌ Food API failed (HTTP $food_api)"
fi

# Test Frontend
echo "🌐 Testing Frontend..."
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ $frontend_status -eq 200 ]; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend failed (HTTP $frontend_status)"
fi

# Test Admin
echo "⚙️ Testing Admin..."
admin_status=$(curl -s -o /dev/null -w "%{http_code}" $ADMIN_URL)
if [ $admin_status -eq 200 ]; then
    echo "✅ Admin panel accessible"
else
    echo "❌ Admin panel failed (HTTP $admin_status)"
fi

echo "🎯 Testing Complete!"
```

## Manual Testing Checklist

### Backend API Testing

#### 1. Health Check
```bash
curl https://backend-ten-azure-58.vercel.app/
# Expected Response: {"status":"API Working","version":"1.0.0","environment":"development"}
```

#### 2. Food List API
```bash
curl https://backend-ten-azure-58.vercel.app/api/food/list
# Expected: {"success":true,"data":[array of food items],"count":number}
```

#### 3. User Registration
```bash
curl -X POST https://backend-ten-azure-58.vercel.app/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "testpassword123"
  }'
# Expected: {"success":true,"token":"jwt-token-here"}
```

#### 4. User Login
```bash
curl -X POST https://backend-ten-azure-58.vercel.app/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
# Expected: {"success":true,"token":"jwt-token-here"}
```

### Frontend Testing Checklist

**Visit**: https://frontend-beige-eight-62.vercel.app

**Navigation Tests:**
- [ ] Home page loads without errors
- [ ] Menu categories display correctly
- [ ] Food items load with images
- [ ] Search functionality works
- [ ] Cart icon shows item count

**Authentication Tests:**
- [ ] Login popup opens
- [ ] Registration form works
- [ ] Login with valid credentials
- [ ] Token stored in localStorage
- [ ] User profile shows after login

**Cart Functionality:**
- [ ] Add items to cart
- [ ] Remove items from cart
- [ ] Cart total calculates correctly
- [ ] Proceed to checkout works

**Order Flow:**
- [ ] Place order form loads
- [ ] Address form validation
- [ ] Payment integration works
- [ ] Order confirmation received

### Admin Panel Testing

**Visit**: https://admin-kappa-ivory.vercel.app

**Food Management:**
- [ ] Food list displays correctly
- [ ] Add new food item
- [ ] Upload image functionality
- [ ] Edit existing food items
- [ ] Delete food items

**Order Management:**
- [ ] Orders list displays
- [ ] Order status updates
- [ ] Order details view
- [ ] Filter orders by status

### Performance Testing

#### Load Time Tests
```bash
# Test backend response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://backend-ten-azure-58.vercel.app/api/food/list

# Test frontend load time  
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://frontend-beige-eight-62.vercel.app
```

#### Image Loading Tests
- [ ] Food images load quickly
- [ ] Images display at correct sizes
- [ ] Lazy loading works properly
- [ ] No broken image links

### Database Connectivity Tests

#### MongoDB Connection
```bash
# Test data persistence
# 1. Add a food item via admin
# 2. Check if it appears in frontend
# 3. Add item to cart
# 4. Verify cart persists after login
```

#### AWS S3 Integration
- [ ] Image upload works
- [ ] Images display from S3
- [ ] Image deletion works
- [ ] CORS headers allow image access

### Payment Integration Tests

#### Stripe Integration
- [ ] Payment form loads
- [ ] Test card numbers work
- [ ] Payment success redirects correctly
- [ ] Payment failure handled gracefully
- [ ] Order status updates after payment

**Test Card Numbers:**
```
# Success: 4242424242424242
# Declined: 4000000000000002
# Insufficient funds: 4000000000009995
```

### Error Handling Tests

#### Network Error Simulation
- [ ] Offline functionality (if implemented)
- [ ] API timeout handling
- [ ] Connection error messages

#### Validation Tests
- [ ] Form validation works
- [ ] Invalid email format rejected
- [ ] Weak passwords rejected
- [ ] Required fields enforced

### Security Tests (Basic)

#### Input Validation
- [ ] XSS protection (try `<script>alert('test')</script>`)
- [ ] SQL injection protection
- [ ] File upload restrictions

#### Authentication
- [ ] Unauthorized API access blocked
- [ ] Token expiration handled
- [ ] Secure logout functionality

## Test Data Setup

### Sample Food Items for Testing
```json
{
  "name": "Test Pizza",
  "description": "Delicious test pizza for deployment testing",
  "price": 15.99,
  "category": "Pizza"
}
```

### Test User Accounts
```json
{
  "name": "Test Customer",
  "email": "customer@test.com",
  "password": "testpass123"
}
```

### Test Orders
```json
{
  "address": {
    "firstName": "John",
    "lastName": "Doe", 
    "street": "123 Test St",
    "city": "Test City",
    "state": "TS",
    "zipcode": "12345",
    "country": "Australia",
    "phone": "0412345678"
  }
}
```

## Deployment Verification Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Build processes successful
- [ ] Local testing completed
- [ ] Database connection verified
- [ ] AWS S3 permissions configured

### Post-Deployment  
- [ ] All URLs accessible
- [ ] API endpoints responding
- [ ] Database operations working
- [ ] File uploads functional
- [ ] Payment processing active
- [ ] Error logging active

### Performance Verification
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Images load efficiently
- [ ] No console errors
- [ ] Mobile responsiveness works

## Monitoring Setup

### Health Check Endpoints
```bash
# Set up monitoring for:
# - https://backend-ten-azure-58.vercel.app/
# - https://frontend-beige-eight-62.vercel.app
# - https://admin-kappa-ivory.vercel.app

# Use services like:
# - Vercel Analytics
# - Uptime monitoring tools
# - Error tracking services
```

### Alerts Configuration
- Backend downtime alerts
- Database connection failures
- High error rates
- Performance degradation
- Storage quota warnings

This comprehensive testing guide ensures your deployment is fully functional and ready for production use!