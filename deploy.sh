#!/bin/bash

set -e

echo "Starting deployment at $(date)"

# Navigate to the app directory
cd /var/www/macro-tracker/

# Pull the latest changes from the main branch
echo "Pulling latest changes from git..."
git pull origin master

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
bun install --frozen-lockfile

# Copy production environment variables
echo "Setting up production environment variables..."
if [ -f .env.production ]; then
    cp .env.production .env
    echo "✅ Production environment variables copied"
else
    echo "❌ Error: .env.production file not found!"
    echo ""
    echo "The .env.production file needs to be created manually on the server"
    echo "because environment files are excluded from git for security reasons."
    echo ""
    echo "Please create /var/www/macro-tracker/backend/.env.production with your"
    echo "production environment variables, then run this script again."
    echo ""
    echo "Required variables:"
    echo "- JWT_SECRET"
    echo "- STRIPE_SECRET_KEY"
    echo "- STRIPE_WEBHOOK_SECRET" 
    echo "- STRIPE_PRICE_ID_MONTHLY"
    echo "- STRIPE_PRICE_ID_YEARLY"
    echo "- RESEND_API_KEY"
    echo "- CORS_ORIGIN"
    echo ""
    echo "See DEPLOYMENT.md for detailed instructions."
    exit 1
fi

# Install frontend dependencies and build the static site
echo "Building frontend..."
cd ../frontend
bun install --frozen-lockfile
bun run build

if [ ! -d "./dist" ]; then
    echo "❌ Frontend build failed - dist directory not found"
    exit 1
fi

# Go back to root directory for PM2 ecosystem
cd ..

# Create logs directory if it doesn't exist
echo "Setting up logging directory..."
mkdir -p logs

# Restart applications using PM2 ecosystem file
echo "Restarting applications with PM2..."
pm2 reload ecosystem.config.js

# Check if backend started successfully
sleep 3
if pm2 describe macro-tracker-api > /dev/null; then
    echo "✅ Backend API started successfully"
else
    echo "❌ Backend API failed to start"
    pm2 logs macro-tracker-api --lines 20
    exit 1
fi

# Check if frontend started successfully
if pm2 describe macro-frontend > /dev/null; then
    echo "✅ Frontend server started successfully"
else
    echo "❌ Frontend server failed to start"
    pm2 logs macro-frontend --lines 20
    exit 1
fi

echo "Deployment finished successfully at $(date)"
echo "Backend API: http://localhost:3000"
echo "Frontend: http://localhost:5173"
