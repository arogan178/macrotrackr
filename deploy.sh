#!/bin/bash

set -e

echo "Starting deployment at $(date)"

# Navigate to the app directory
cd /var/www/macro-tracker/

# Pull the latest changes from the main branch
git pull origin master

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
bun install --frozen-lockfile

# Restart backend API with PM2
echo "Restarting backend API..."
pm2 restart macro-tracker-api || pm2 start "bun run start" --name macro-tracker-api

# Install frontend dependencies and build the static site
echo "Building frontend..."
cd ../frontend
bun install --frozen-lockfile
# bun run build # Uncomment this line if you want to build the frontend on server

# Serve frontend with PM2 and .env (ensure you have pm2 installed globally and serve installed)
echo "Restarting frontend static server..."
pm2 restart macro-frontend || pm2 start "bunx serve ./dist --single --listen 5173" --name macro-frontend --cwd $(pwd)

echo "Deployment finished successfully at $(date)"
