# Frontend Deployment Guide

This guide covers building and deploying the frontend in both runtime profiles:

- `managed`: Clerk auth and managed billing UI enabled
- `self-hosted`: local auth UI and billing surfaces disabled

## Build prerequisites

Create a `frontend/.env` file (or provide equivalent CI env vars) with:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_URL=http://localhost:5173
VITE_PUBLIC_APP_NAME=Macro Tracker
VITE_SUPPORT_EMAIL=support@local.invalid

# Runtime profile knobs
VITE_AUTH_MODE=local
VITE_BILLING_MODE=disabled
VITE_ANALYTICS_MODE=disabled

# Required only when VITE_AUTH_MODE=clerk
# VITE_CLERK_PUBLISHABLE_KEY=pk_test_replace_me

# Required only when VITE_ANALYTICS_MODE=posthog
# VITE_PUBLIC_POSTHOG_KEY=phc_replace_me
# VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

## Local production build

```bash
bun run --cwd frontend install
bun run --cwd frontend build
```

Output is written to `frontend/dist/`.

## Deploying static assets

Serve `frontend/dist/` behind your reverse proxy/CDN and route all unknown paths to `index.html` for SPA routing.

Recommended cache policy:

- `assets/*`: long cache with immutable filenames
- `index.html`, `manifest.webmanifest`, `sitemap.xml`: short cache

## Runtime notes

- `VITE_APP_URL` controls generated canonical URLs and sitemap host defaults.
- Billing pages/components should only be reachable in `managed` profile (`VITE_BILLING_MODE=managed`).
- Clerk UI is mounted only in `clerk` mode (`VITE_AUTH_MODE=clerk`).
