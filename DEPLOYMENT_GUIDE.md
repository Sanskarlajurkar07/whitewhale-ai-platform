# WhiteWhale AI Deployment Guide

This guide explains how to deploy your frontend and backend applications and ensure they connect properly in production.

## Current Setup
- **Frontend**: React app in `/ui` folder
- **Backend**: Node.js/Express app in `/backend` folder

## 🔧 Quick Fix for Connection Issues

### 1. Environment Variables Setup

**Frontend (`/ui/.env`):**
```bash
# For development
REACT_APP_API_URL=http://localhost:8000
```

**Frontend Production (`/ui/.env.production`):**
```bash
# Update with your actual backend URL
REACT_APP_API_URL=https://your-backend-domain.com
```

### 2. Update Your Production Environment File

Edit `/ui/.env.production` with your actual backend URL:

**For Render.com backend:**
```bash
REACT_APP_API_URL=https://whitewhaleai-backend-1.onrender.com
```

**For Vercel backend:**
```bash
REACT_APP_API_URL=https://your-backend.vercel.app
```

**For Railway backend:**
```bash
REACT_APP_API_URL=https://your-backend.up.railway.app
```

## 🚀 Deployment Options

### Option 1: Both on Vercel (Recommended)

#### Backend Deployment:
1. Push your backend to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard:
   ```
   PORT=8000
   GOOGLE_API_KEY=your_api_key_here
   NODE_ENV=production
   ```

#### Frontend Deployment:
1. Update `/ui/.env.production` with your Vercel backend URL
2. Deploy frontend to Vercel
3. Set build command: `npm run build`
4. Set output directory: `build`

### Option 2: Backend on Render, Frontend on Vercel

#### Backend (Render):
1. Connect your GitHub repo to Render
2. Set environment variables:
   ```
   PORT=8000
   GOOGLE_API_KEY=your_api_key_here
   NODE_ENV=production
   ```
3. Set build command: `npm install`
4. Set start command: `npm start`

#### Frontend (Vercel):
1. Update `/ui/.env.production`:
   ```bash
   REACT_APP_API_URL=https://your-render-backend.onrender.com
   ```
2. Deploy to Vercel

### Option 3: Both on Railway

#### Backend:
1. Connect GitHub to Railway
2. Set environment variables in Railway dashboard
3. Railway will auto-deploy on push

#### Frontend:
1. Update `/ui/.env.production` with Railway backend URL
2. Deploy frontend to Railway or Vercel

## 🔍 Testing the Connection

### 1. Test Backend Endpoints

```bash
# Health check
curl https://your-backend-url/health

# CORS test
curl https://your-backend-url/test
```

### 2. Check Frontend Console

Open browser dev tools and look for:
```javascript
Using API base URL: https://your-backend-url
Environment: production
```

### 3. Test API Call

In your frontend, the workflow execution should show:
```
Attempt 1/3: Calling https://your-backend-url/run-workflow
```

## 🛠️ Troubleshooting

### CORS Errors
If you see CORS errors, check:
1. Your frontend URL is added to backend CORS configuration
2. The backend is running and accessible
3. Environment variables are set correctly

### Connection Timeout
If requests timeout:
1. Backend might be on free tier (cold starts)
2. Check if backend URL is correct
3. Verify backend is actually running

### 404 Errors
1. Check if backend URL is correct
2. Verify API endpoints exist
3. Check if backend is properly deployed

## 📝 Environment Variables Reference

### Backend Required Variables:
```bash
PORT=8000
GOOGLE_API_KEY=your_google_api_key
NODE_ENV=production
```

### Frontend Required Variables:
```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

## 🔄 Update Process

When you need to change backend URL:

1. **Update frontend environment:**
   ```bash
   # Edit /ui/.env.production
   REACT_APP_API_URL=https://new-backend-url.com
   ```

2. **Update backend CORS (if needed):**
   ```javascript
   // Add your new frontend domain to server.js corsOptions
   'https://your-new-frontend-domain.com'
   ```

3. **Rebuild and redeploy both applications**

## 🚨 Security Notes

1. Never commit API keys to version control
2. Use environment variables for all sensitive data
3. Keep your Google API key secure
4. Use HTTPS in production
5. Regularly rotate API keys

## 📞 Common Issues & Solutions

**Issue**: "Cannot connect to backend server"
**Solution**: Check if backend URL is correct and backend is running

**Issue**: CORS policy error  
**Solution**: Add your frontend domain to backend CORS configuration

**Issue**: API key not working
**Solution**: Verify Google API key is set in backend environment variables

**Issue**: Frontend shows localhost URL in production
**Solution**: Check if REACT_APP_API_URL is set in production environment