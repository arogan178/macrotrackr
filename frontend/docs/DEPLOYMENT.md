# Deployment Guide

## Prerequisites

### Environment Variables Setup

**IMPORTANT**: Environment files are excluded from git for security reasons. You must manually create the `.env.production` file on your production server before deploying.

The backend requires several environment variables to be set. Create the file `/var/www/macro-tracker/backend/.env.production` with the following content:

```bash
# .env - Environment variables for Macro Trackr Backend

# --- Server Configuration ---
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# --- Database Configuration ---
DATABASE_PATH=./macro_tracker.db

# --- Security ---
JWT_SECRET=your_jwt_secret_here_minimum_32_characters

# --- CORS ---
CORS_ORIGIN=https://macrotrackr.com

# --- Stripe Configuration ---
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID_MONTHLY=your_monthly_price_id
STRIPE_PRICE_ID_YEARLY=your_yearly_price_id

# --- Email Configuration ---
RESEND_API_KEY=your_resend_api_key
```

### Creating the Environment File on Server

On your production server, run:

```bash
cd /var/www/macro-tracker/backend
nano .env.production
# Copy and paste the content above with your actual values
# Save and exit (Ctrl+X, then Y, then Enter in nano)
```

Required environment variables:

- `JWT_SECRET` - Secret key for JWT token signing (minimum 32 characters)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret for webhook verification
- `STRIPE_PRICE_ID_MONTHLY` - Stripe price ID for monthly Pro subscription
- `STRIPE_PRICE_ID_YEARLY` - Stripe price ID for yearly Pro subscription
- `RESEND_API_KEY` - Resend API key for email services

## Automated Deployment

**Prerequisites:**

1. Frontend must be built locally and the `dist` folder committed to the repository
2. Production environment variables must be set on the server (see above)

Build the frontend locally before deploying:

```bash
cd frontend
bun install
bun run build
git add dist/
git commit -m "Update frontend build"
git push
```

Run the deployment script on your production server:

```bash
bash deploy.sh
```

This script will:

1. Pull the latest code from the git repository
2. Install backend dependencies
3. Copy production environment variables
4. Check that the frontend dist folder exists
5. Start/restart both backend and frontend services using PM2

## Manual Deployment Steps

If you need to deploy manually:

### Backend

```bash
cd backend
bun install --frozen-lockfile
cp .env.production .env
pm2 restart macro-tracker-api || pm2 start ecosystem.config.js --only macro-tracker-api
```

### Frontend

The frontend should already be built and committed to the repository:

```bash
cd frontend
# Dist folder should already exist from local build
pm2 restart macro-frontend || pm2 start ecosystem.config.js --only macro-frontend
```

If you need to build manually on the server:

```bash
cd frontend
bun install --frozen-lockfile
bun run build
pm2 restart macro-frontend || pm2 start ecosystem.config.js --only macro-frontend
```

## Troubleshooting

### Environment Variables Error

If you see "❌ Error: .env.production file not found!" during deployment:

1. **Create the missing file**: Environment files are gitignored for security, so you need to create `.env.production` manually on your server:

   ```bash
   cd /var/www/macro-tracker/backend
   nano .env.production
   # Add your production environment variables (see template above)
   ```

2. **Verify the file exists**:

   ```bash
   ls -la /var/www/macro-tracker/backend/.env.production
   ```

3. **Check file permissions**:
   ```bash
   chmod 600 /var/www/macro-tracker/backend/.env.production
   ```

If you see "Invalid environment variables" errors after creating the file:

1. Check that all required environment variables are set in `.env.production`
2. Ensure there are no syntax errors or missing quotes in the file
3. Verify that the values are correct (especially check for trailing spaces)

### PM2 Issues

View logs:

```bash
pm2 logs macro-tracker-api
pm2 logs macro-frontend
```

Restart services:

```bash
pm2 restart macro-tracker-api
pm2 restart macro-frontend
```

Check status:

```bash
pm2 status
```

## Services

After successful deployment:

- Backend API: http://localhost:3000
- Frontend: http://localhost:5173
- API Documentation: http://localhost:3000/api/docs
