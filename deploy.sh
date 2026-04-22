#!/bin/bash

# Enhanced deployment script for automated GitHub Actions deployment
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Ensure /root/.bun/bin and /usr/local/bin are in PATH for bun and pm2
export PATH=$PATH:/root/.bun/bin:/usr/local/bin

# Check if running in dry-run mode
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    log "Dry run mode - no changes will be made"
fi

log "Starting deployment"

# Navigate to the app directory
if [ "$DRY_RUN" = false ]; then
    cd /var/www/macrotrackr/ || {
        error "Failed to navigate to /var/www/macrotrackr/"
        exit 1
    }
else
    log "Would navigate to /var/www/macrotrackr/"
fi

# Pull the latest changes from the main branch
log "Pulling latest changes from git..."
if [ "$DRY_RUN" = false ]; then
    git stash push -m "Automated stash before deployment" --include-untracked || true
git pull origin master
else
    log "Would stash and pull latest changes from git"
fi

# Copy production environment variables (must exist before backend starts)
log "Setting up production environment variables..."
if [ "$DRY_RUN" = false ]; then
    if [ -f backend/.env.production ]; then
        cp backend/.env.production backend/.env
        log "Production environment variables copied"
    else
        warn "backend/.env.production file not found!"
        warn "Environment variables will not be configured"
        warn "Please create /var/www/macrotrackr/backend/.env.production with your production environment variables"
    fi
else
    log "Would copy production environment variables if they exist"
fi

# Install all dependencies using workspaces (from root)
log "Installing dependencies..."
if [ "$DRY_RUN" = false ]; then
    bun install --frozen-lockfile
else
    log "Would install dependencies with bun"
fi

# Build frontend
log "Building frontend..."
if [ "$DRY_RUN" = false ]; then
    cd frontend || {
        error "Failed to navigate to frontend directory"
        exit 1
    }
else
    log "Would navigate to frontend directory"
fi

# Clear any existing dist and cache
log "Clearing build cache..."
if [ "$DRY_RUN" = false ]; then
    rm -rf dist/
    rm -rf node_modules/.vite/
    rm -rf .tanstack/
else
    log "Would clear build cache"
fi

# Force clean build
log "Building frontend with clean cache..."

# Set V8 heap to 4GB for the build (adjust if you increase swap/RAM)
export NODE_OPTIONS="--max-old-space-size=2048"
log "NODE_OPTIONS set to: $NODE_OPTIONS"

# Preferred: invoke Vite with node so NODE_OPTIONS is honored reliably. If node-based Vite isn't present, fall back to bun.
if [ "$DRY_RUN" = false ]; then
    if [ -f node_modules/vite/bin/vite.js ]; then
        log "Running Vite build via node (honors NODE_OPTIONS)..."
        node ./node_modules/vite/bin/vite.js build
    else
        log "vite not found in node_modules; falling back to bun run build"
        bun run build
    fi
else
    log "Would build frontend using Vite"
fi

# Unset NODE_OPTIONS to avoid leaking the setting to later commands
unset NODE_OPTIONS

# Check if frontend dist folder exists
log "Checking frontend dist folder..."
if [ "$DRY_RUN" = false ]; then
    if [ ! -d "./dist" ]; then
        error "Frontend dist folder not found after build!"
        exit 1
    else
        log "Frontend dist folder found"
    fi
else
    log "Would check if frontend dist folder exists"
fi

# Go back to root directory for PM2 ecosystem
if [ "$DRY_RUN" = false ]; then
    cd .. || {
        error "Failed to navigate back to root directory"
        exit 1
    }
else
    log "Would navigate back to root directory"
fi

# Create logs directory if it doesn't exist
log "Setting up logging directory..."
if [ "$DRY_RUN" = false ]; then
    mkdir -p logs
else
    log "Would create logs directory"
fi

# Restart applications using PM2 ecosystem file
log "Restarting applications with PM2..."
if [ "$DRY_RUN" = false ]; then
    pm2 reload ecosystem.config.cjs || {
        error "PM2 reload failed"
        log "Attempting PM2 restart instead..."
        pm2 restart ecosystem.config.cjs || {
            error "PM2 restart also failed"
            exit 1
        }
    }
else
    log "Would restart applications with PM2"
fi

# Check if backend started successfully
sleep 3
log "Checking backend API status..."
if [ "$DRY_RUN" = false ]; then
    if pm2 describe macrotrackr-api > /dev/null; then
        log "Backend API started successfully"
    else
        error "Backend API failed to start"
        pm2 logs macrotrackr-api --lines 20 || true
        exit 1
    fi
else
    log "Would check backend API status"
fi

# Check if frontend started successfully
log "Checking frontend server status..."
if [ "$DRY_RUN" = false ]; then
    if pm2 describe macro-frontend > /dev/null; then
        log "Frontend server started successfully"
    else
        error "Frontend server failed to start"
        pm2 logs macro-frontend --lines 20 || true
        exit 1
    fi
else
    log "Would check frontend server status"
fi

log "Deployment finished successfully at $(date)"
log "Backend API: http://localhost:3000"
log "Frontend: http://localhost:5173"

# Cleanup old logs
if [ "$DRY_RUN" = false ]; then
    find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    log "Cleaned up old log files"
else
    log "Would clean up old log files"
fi
