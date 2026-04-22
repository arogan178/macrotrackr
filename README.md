# Macro Tracker

Macro Tracker is an AGPLv3 nutrition and macro tracking application with two runtime profiles:

- `managed`: Clerk authentication and managed billing
- `self-hosted`: local authentication and billing disabled

The backend uses SQLite for this OSS release.

## License

This project is licensed under the GNU Affero General Public License v3.0.
See `LICENSE`.

## Runtime Profiles

### Managed profile

- `APP_MODE=managed`
- `AUTH_MODE=clerk`
- `BILLING_MODE=managed`

Expected behavior:

- Clerk auth middleware/routes mounted
- Billing routes mounted
- Billing UI visible

### Self-hosted profile

- `APP_MODE=self-hosted`
- `AUTH_MODE=local`
- `BILLING_MODE=disabled`

Expected behavior:

- Local auth routes enabled (`/api/auth/*` local endpoints)
- Session transport via `mt_session` secure cookie + DB-backed sessions
- Billing routes unmounted (`404` by absence)
- Billing UI hidden

## Environment Contracts

Backend canonical variables:

- `APP_MODE`, `AUTH_MODE`, `BILLING_MODE`, `ANALYTICS_MODE`, `EMAIL_MODE`
- `APP_URL`, `PUBLIC_APP_NAME`, `SUPPORT_EMAIL`
- `ENABLE_METRICS`

Frontend optional branding/public link variables:

- `VITE_APP_URL`
- `VITE_PUBLIC_APP_NAME`
- `VITE_SUPPORT_EMAIL`
- `VITE_GITHUB_REPO_URL`
- `VITE_DOCS_URL`

Provider env vars are only required when corresponding modes are enabled:

- Clerk keys only when `AUTH_MODE=clerk`
- Stripe keys only when `BILLING_MODE=managed`
- PostHog keys only when `ANALYTICS_MODE=posthog`
- Resend/SMTP keys only when `EMAIL_MODE=resend|smtp`

Reference templates:

- `backend/.env.example`
- `frontend/.env.example`

## Quick Start (Local Development)

```bash
bun install
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development
bun run dev
```

Useful scripts:

```bash
bun run dev:backend
bun run dev:frontend
bun run --cwd backend test
bun run --cwd frontend test
bun run typecheck
bun run lint
```

## Self-Hosting with Docker Compose

This repository includes a self-host starter compose stack.

```bash
mkdir -p data
docker compose up --build
```

The compose file bakes the frontend in local-auth mode (`VITE_AUTH_MODE=local`) by default,
so no Clerk publishable key is required for self-hosted deployments.
It also uses same-origin API requests (`/api`) through nginx proxying, so clients do not
need to reach backend on `localhost`.

Services:

- frontend: `http://localhost:5173` (Mapped to internal container port 80)
- backend API: `http://localhost:3000` (Direct access usually not needed since frontend proxies `/api`)

The SQLite database is persisted at `./data/macro_tracker.db`.

### First-run bootstrap

1. Start the stack.
2. Open `http://localhost:5173/register`.
3. Create the initial local user account.

## Backup, Restore, and Upgrade (Self-host)

### Backup

```bash
cp data/macro_tracker.db data/macro_tracker.db.backup
```

### Restore

```bash
cp data/macro_tracker.db.backup data/macro_tracker.db
```

### Upgrade

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

## Deployment Notes

- Managed deployment workflow docs: `.github/README_DEPLOY.md`
- Frontend deployment guide: `frontend/docs/DEPLOYMENT.md`
- Stripe webhook setup (managed only): `backend/docs/WEBHOOK_SETUP.md`

## Project Layout

```text
backend/   Bun + Elysia API, SQLite schema, auth/billing modules
frontend/  React + Vite app (mode-aware auth and billing UI)
docs/      public project docs
```
