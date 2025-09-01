# 🚀 BoingBox Deployment Guide

This guide will help you deploy BoingBox to production using Render, Vercel, or Netlify.

## 📋 Prerequisites

- **GitHub Account**: To host your code
- **MongoDB Atlas Account**: For production database
- **Render/Vercel/Netlify Account**: For hosting

## 🏗️ Backend Deployment

### Option 1: Deploy to Render (Recommended)

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/yourusername/BoingBox.git
   cd BoingBox/server
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `server` folder

4. **Configure Service**
   - **Name**: `boingbox-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://mamidipaka2003_db_user:UQyC0QwKxtizlRhU@cluster0.ip6x0fa.mongodb.net/boingbox?retryWrites=true&w=majority&appName=Cluster0
   SECRET=HARSHA
   CLIENT_URL=https://your-frontend-domain.com
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the generated URL (e.g., `https://boingbox-backend.onrender.com`)

### Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd server
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add the same variables as above

## 🌐 Frontend Deployment

### Step 1: Update Backend URL

After deploying the backend, update the frontend configuration:

1. **Update Environment Variables**
   ```bash
   cd public
   cp env.example .env
   ```

2. **Edit `.env` file**
   ```env
   REACT_APP_HOST=https://your-backend-domain.com
   REACT_APP_API_URL=https://your-backend-domain.com
   ```

3. **Update APIRoutes.js**
   ```javascript
   // In public/src/utils/APIRoutes.js
   export const host = process.env.REACT_APP_HOST || "http://localhost:5000";
   ```

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd public
   vercel
   ```

3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Option 2: Deploy to Netlify

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Deploy from Git**
   - Click "New site from Git"
   - Connect your repository
   - Select the `public` folder

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`

### Option 3: Deploy to Render

1. **Create Static Site**
   - Click "New +" → "Static Site"
   - Connect your repository
   - Select the `public` folder

2. **Configure Build**
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://mamidipaka2003_db_user:UQyC0QwKxtizlRhU@cluster0.ip6x0fa.mongodb.net/boingbox?retryWrites=true&w=majority&appName=Cluster0
SECRET=HARSHA
CLIENT_URL=https://your-frontend-domain.com
```

### Frontend (.env)
```env
REACT_APP_HOST=https://your-backend-domain.com
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_LOCALHOST_KEY=boingbox-user
```

## 📱 PWA Configuration

### Update manifest.json
```json
{
  "name": "BoingBox Chat",
  "short_name": "BoingBox",
  "start_url": "/",
  "scope": "/",
  "display": "standalone"
}
```

### Service Worker
- Ensure `/sw.js` is accessible
- Update cache names if needed
- Test offline functionality

## 🗄️ Database Setup

### MongoDB Atlas
1. **Create Cluster**
   - Choose free tier
   - Select region close to your users

2. **Create Database User**
   - Username and password
   - Network access (0.0.0.0/0 for production)

3. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/boingbox
   ```

## 🚀 Deployment Checklist

### Backend
- [ ] Environment variables set
- [ ] MongoDB Atlas configured
- [ ] CORS settings updated
- [ ] Health check endpoint working
- [ ] All API routes accessible

### Frontend
- [ ] Backend URL updated
- [ ] Environment variables set
- [ ] Build successful
- [ ] PWA working
- [ ] Service worker registered

### Testing
- [ ] User registration/login
- [ ] Real-time messaging
- [ ] File uploads
- [ ] Voice/video calls
- [ ] PWA installation
- [ ] Offline functionality

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CLIENT_URL` in backend
   - Verify CORS configuration

2. **Database Connection**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string

3. **Build Failures**
   - Check Node.js version (>=16)
   - Clear npm cache
   - Check for missing dependencies

4. **PWA Issues**
   - Verify manifest.json
   - Check service worker
   - Test HTTPS requirement

## 📞 Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check README.md for detailed setup
- **Community**: Join our Discord/Telegram for help

## 🎉 Success!

After deployment, your BoingBox application will be available at:
- **Frontend**: `https://your-frontend-domain.com`
- **Backend**: `https://your-backend-domain.com`

**Happy Chatting! 🚀**
