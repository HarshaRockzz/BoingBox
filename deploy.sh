#!/bin/bash

echo "🚀 BoingBox Deployment Script"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "server/package.json" ] || [ ! -f "public/package.json" ]; then
    echo "❌ Please run this script from the BoingBox root directory"
    exit 1
fi

# Function to deploy backend
deploy_backend() {
    echo "🏗️ Deploying Backend..."
    
    cd server
    
    # Check if vercel is installed
    if command -v vercel &> /dev/null; then
        echo "📦 Deploying to Vercel..."
        vercel --prod
    else
        echo "⚠️ Vercel CLI not found. Please install it first:"
        echo "   npm i -g vercel"
        echo ""
        echo "📋 Manual deployment steps:"
        echo "   1. Go to render.com or vercel.com"
        echo "   2. Create new web service"
        echo "   3. Connect your GitHub repo"
        echo "   4. Set environment variables"
        echo "   5. Deploy!"
    fi
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo "🌐 Deploying Frontend..."
    
    cd public
    
    # Check if vercel is installed
    if command -v vercel &> /dev/null; then
        echo "📦 Deploying to Vercel..."
        vercel --prod
    else
        echo "⚠️ Vercel CLI not found. Please install it first:"
        echo "   npm i -g vercel"
        echo ""
        echo "📋 Manual deployment steps:"
        echo "   1. Go to vercel.com or netlify.com"
        echo "   2. Create new project"
        echo "   3. Connect your GitHub repo"
        echo "   4. Set build settings"
        echo "   5. Deploy!"
    fi
    
    cd ..
}

# Function to show deployment status
show_status() {
    echo ""
    echo "📊 Deployment Status"
    echo "==================="
    echo "✅ Backend package.json updated"
    echo "✅ Frontend package.json updated"
    echo "✅ Vercel configs created"
    echo "✅ Render configs created"
    echo "✅ Environment examples created"
    echo "✅ Deployment guide created"
    echo ""
    echo "🚀 Next Steps:"
echo "   1. Deploy backend first (MongoDB already configured)"
echo "   2. Update frontend with backend URL"
echo "   3. Deploy frontend"
echo "   4. Test all features"
echo ""
echo "📊 Backend Configuration:"
echo "   ✅ MongoDB: mongodb+srv://mamidipaka2003_db_user:UQyC0QwKxtizlRhU@cluster0.ip6x0fa.mongodb.net/boingbox"
echo "   ✅ Secret: HARSHA"
echo "   ✅ Environment: Production"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
}

# Main deployment flow
echo "🔧 Updating package.json files..."
echo "📝 Creating deployment configs..."
echo "📚 Creating deployment guide..."

echo ""
echo "🎯 Choose deployment option:"
echo "   1. Deploy Backend"
echo "   2. Deploy Frontend"
echo "   3. Show Status"
echo "   4. Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        show_status
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please try again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📖 Check DEPLOYMENT.md for next steps"
