# Deployment Guide

## Environment Variables Setup

The backend requires several environment variables to be set. These are configured in `.env.production` for production deployments.

Required environment variables:
- `JWT_SECRET` - Secret key for JWT token signing (minimum 32 characters)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret for webhook verification
- `STRIPE_PRICE_ID_MONTHLY` - Stripe price ID for monthly Pro subscription
- `STRIPE_PRICE_ID_YEARLY` - Stripe price ID for yearly Pro subscription
- `RESEND_API_KEY` - Resend API key for email services

## Automated Deployment

Run the deployment script on your production server:

```bash
bash deploy.sh
```

This script will:
1. Pull the latest code from the git repository
2. Install backend dependencies
3. Copy production environment variables
4. Build the frontend
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
```bash
cd frontend
bun install --frozen-lockfile
bun run build
pm2 restart macro-frontend || pm2 start ecosystem.config.js --only macro-frontend
```

## Troubleshooting

### Environment Variables Error
If you see "Invalid environment variables" errors, check:
1. `.env.production` file exists in the backend directory
2. All required environment variables are set in `.env.production`
3. The deployment script successfully copied `.env.production` to `.env`

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
