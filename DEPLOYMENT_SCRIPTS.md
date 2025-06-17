# 🛠️ DEPLOYMENT SCRIPTS & TROUBLESHOOTING

## Quick Deployment Commands

### Deploy All Components
```bash
#!/bin/bash
# deploy-all.sh

echo "🚀 Starting full deployment..."

# Deploy Backend
echo "📦 Deploying Backend..."
cd backend
vercel --prod
if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

# Deploy Frontend
echo "📦 Deploying Frontend..."
cd ../frontend
vercel --prod
if [ $? -eq 0 ]; then
    echo "✅ Frontend deployed successfully" 
else
    echo "❌ Frontend deployment failed"
    exit 1
fi

# Deploy Admin
echo "📦 Deploying Admin..."
cd ../admin
vercel --prod
if [ $? -eq 0 ]; then
    echo "✅ Admin deployed successfully"
else
    echo "❌ Admin deployment failed"
    exit 1
fi

echo "🎉 All deployments completed successfully!"
```

## Troubleshooting Scripts

### Test Backend Connection
```bash
#!/bin/bash
# test-backend.sh

BACKEND_URL="https://backend-ten-azure-58.vercel.app"

echo "🔍 Testing Backend Connection..."

# Test health endpoint
echo "Testing health endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/)
if [ $response -eq 200 ]; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed (HTTP $response)"
fi

# Test food list
echo "Testing food list API..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/food/list)
if [ $response -eq 200 ]; then
    echo "✅ Food list API working"
else
    echo "❌ Food list API failed (HTTP $response)"
fi

# Test CORS
echo "Testing CORS configuration..."
response=$(curl -s -H "Origin: https://frontend-beige-eight-62.vercel.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS $BACKEND_URL/api/food/list)
echo "CORS response: $response"
```

### Test Frontend
```bash
#!/bin/bash
# test-frontend.sh

FRONTEND_URL="https://frontend-beige-eight-62.vercel.app"

echo "🔍 Testing Frontend..."

# Test if frontend loads
response=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ $response -eq 200 ]; then
    echo "✅ Frontend loads successfully"
else
    echo "❌ Frontend failed to load (HTTP $response)"
fi

# Test if it's a React app
content=$(curl -s $FRONTEND_URL | grep -o "react")
if [ ! -z "$content" ]; then
    echo "✅ React app detected"
else
    echo "❌ React app not detected"
fi
```

### Environment Variables Checker
```bash
#!/bin/bash
# check-env.sh

echo "🔍 Environment Variables Checker"

# Backend required variables
BACKEND_VARS=("MONGODB_URI" "JWT_SECRET" "STRIPE_SECRET_KEY" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_REGION" "AWS_BUCKET_NAME")

echo "Backend Environment Variables:"
for var in "${BACKEND_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
    else
        echo "✅ $var is set"
    fi
done

# Frontend required variables  
echo -e "\nFrontend Environment Variables:"
if [ -z "$VITE_API_URL" ]; then
    echo "❌ VITE_API_URL is not set"
else
    echo "✅ VITE_API_URL is set: $VITE_API_URL"
fi

if [ -z "$VITE_S3_URL" ]; then
    echo "❌ VITE_S3_URL is not set"
else
    echo "✅ VITE_S3_URL is set: $VITE_S3_URL"
fi
```

## Common Issues & Solutions

### Issue 1: "Module not found" errors
```bash
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Vercel deployment timeout
```bash
# Solution: Optimize build process
# Add to package.json
{
  "scripts": {
    "build": "npm install --production"
  }
}
```

### Issue 3: Environment variables not working
```bash
# Check if variables are set in Vercel dashboard
# Redeploy after adding environment variables
vercel --prod --force
```

### Issue 4: CORS errors in production
```bash
# Verify origin URLs in server.js match exactly
# Check browser developer tools for exact error message
```

### Issue 5: Database connection timeout
```bash
# Check MongoDB Atlas IP whitelist
# Ensure 0.0.0.0/0 is whitelisted for Vercel
# Verify connection string format
```

## Debug Commands

### Backend Debug
```bash
# Check Vercel function logs
vercel logs https://backend-ten-azure-58.vercel.app

# Test individual endpoints
curl -v https://backend-ten-azure-58.vercel.app/api/food/list
```

### Frontend Debug  
```bash
# Check build output
npm run build

# Test production build locally
npm run preview
```

### Database Debug
```bash
# Test MongoDB connection
mongo "mongodb+srv://your-connection-string"

# Check database contents
use fooddelivery
db.foods.find().limit(5)
```

## Performance Monitoring

### Backend Performance
```bash
# Monitor function execution time
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://backend-ten-azure-58.vercel.app/api/food/list
```

### Frontend Performance
```bash
# Check bundle size
npm run build
ls -la dist/assets/
```

## Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous deployment
vercel rollback

# Rollback specific deployment
vercel rollback [deployment-url]
```

### Emergency Procedures
```bash
# If critical issue detected:
# 1. Rollback immediately
vercel rollback

# 2. Check logs
vercel logs

# 3. Fix issue locally
# 4. Test locally 
# 5. Redeploy
vercel --prod
```