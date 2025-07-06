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
