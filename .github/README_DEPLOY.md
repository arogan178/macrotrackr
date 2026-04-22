# Deployment Notes

This repository provides CI workflows for quality checks and managed-profile deployment.

## Runtime profiles

- `managed` profile: Clerk auth + managed billing
- `self-hosted` profile: local auth + billing disabled

## Managed deployment workflow

`.github/workflows/deploy.yml` deploys backend and frontend using repository/environment secrets.

Backend environment written by workflow includes mode-aware variables:

- `APP_MODE=managed`
- `AUTH_MODE=clerk`
- `BILLING_MODE=managed`
- `ANALYTICS_MODE=disabled`
- `EMAIL_MODE=resend`

Frontend build environment written by workflow includes:

- `VITE_AUTH_MODE=clerk`
- `VITE_BILLING_MODE=managed`
- `VITE_ANALYTICS_MODE=disabled`
- `VITE_APP_URL` (from `FRONTEND_APP_URL` secret)

## Required deployment secrets

- `SERVER_HOST`
- `SERVER_SSH_KEY`
- `CORS_ORIGIN`
- `VITE_API_URL`
- `FRONTEND_APP_URL`
- `CLERK_PUBLISHABLE_KEY` (or `VITE_CLERK_PUBLISHABLE_KEY`)
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_PRICE_ID_YEARLY`
- `RESEND_API_KEY`
- Optional: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`

## Self-hosted deployment

Use Docker Compose from the repository root for self-hosted deployments. By default, `docker-compose.yml` pulls prebuilt GHCR images:

- `ghcr.io/arogan178/macrotrackr-backend:latest`
- `ghcr.io/arogan178/macrotrackr-frontend:latest`

Use `docker-compose.build.yml` as an override when you want to build from source locally. See top-level `README.md` for commands and bootstrap flow.
