#!/bin/bash

# Ensure /root/.bun/bin and /usr/local/bin are in PATH for bun and pm2
export PATH=$PATH:/root/.bun/bin:/usr/local/bin

set -e

echo "Starting deployment at $(date)"

# Navigate to the app directory
cd /var/www/macro-tracker/

# Pull the latest changes from the main branch
echo "Pulling latest changes from git..."
git stash
git pull origin master

# Copy production environment variables (must exist before backend starts)
echo "Setting up production environment variables..."
if [ -f backend/.env.production ]; then
        cp backend/.env.production backend/.env
        echo "✅ Production environment variables copied"
else
        echo "❌ Error: backend/.env.production file not found!"
        echo ""
        echo "The backend .env.production file needs to be created manually on the server"
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

# Install frontend and backend dependencies in parallel to speed up deploy
echo "Installing frontend and backend dependencies in parallel..."
# run installs in subshells so cwd doesn't interfere
( cd backend && bun install --frozen-lockfile ) &
PID_BACKEND=$!
( cd frontend && bun install --frozen-lockfile ) &
PID_FRONTEND=$!

# wait for both to finish and capture exit codes
wait $PID_BACKEND
RC_BACKEND=$?
wait $PID_FRONTEND
RC_FRONTEND=$?

if [ $RC_BACKEND -ne 0 ] || [ $RC_FRONTEND -ne 0 ]; then
    echo "One or more dependency installs failed (backend:$RC_BACKEND frontend:$RC_FRONTEND). Exiting."
    exit 1
fi


# Build frontend
echo "Building frontend..."
cd frontend

# Clear any existing dist and cache
echo "Clearing build cache..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf .tanstack/

# Force clean build
echo "Building frontend with clean cache..."

# Set V8 heap to 4GB for the build (adjust if you increase swap/RAM)
export NODE_OPTIONS="--max-old-space-size=2048"
echo "NODE_OPTIONS set to: $NODE_OPTIONS"

# Preferred: invoke Vite with node so NODE_OPTIONS is honored reliably. If node-based Vite isn't present, fall back to bun.
if [ -f node_modules/vite/bin/vite.js ]; then
    echo "Running Vite build via node (honors NODE_OPTIONS)..."
    node ./node_modules/vite/bin/vite.js build
else
    echo "vite not found in node_modules; falling back to bun run build"
    bun run build
fi

# Unset NODE_OPTIONS to avoid leaking the setting to later commands
unset NODE_OPTIONS

# Check if frontend dist folder exists
echo "Checking frontend dist folder..."
if [ ! -d "./dist" ]; then
    echo "❌ Frontend dist folder not found after build!"
    exit 1
else
    echo "✅ Frontend dist folder found"
fi

# # Install serve package for static file serving
# echo "Installing serve package..."
# bun add serve

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
