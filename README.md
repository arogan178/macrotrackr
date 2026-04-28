# Macro Tracker

Macro Tracker is an AGPLv3 nutrition and macro tracking application designed for self-hosting.

The backend uses SQLite with local authentication and billing disabled by default.

## License

This project is licensed under the GNU Affero General Public License v3.0.
See `LICENSE`.

## Self-Hosted Mode

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

- `ANALYTICS_MODE`, `EMAIL_MODE`
- `APP_URL`, `PUBLIC_APP_NAME`, `SUPPORT_EMAIL`
- `ENABLE_METRICS`

Frontend optional branding/public link variables:

- `VITE_APP_URL`
- `VITE_PUBLIC_APP_NAME`
- `VITE_SUPPORT_EMAIL`
- `VITE_GITHUB_REPO_URL`
- `VITE_DOCS_URL`

Provider env vars are only required when corresponding modes are enabled:

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
docker compose pull
docker compose up -d
```

The default compose file uses prebuilt GHCR images in local-auth mode (`VITE_AUTH_MODE=local`),
so no Clerk publishable key is required for self-hosted deployments.
It also uses same-origin API requests (`/api`) through nginx proxying, so clients do not
need to reach backend on `localhost`.

Services:

- frontend: `http://localhost:5173` (Mapped to internal container port 80)
- backend API: `http://localhost:3000` (Direct access usually not needed since frontend proxies `/api`)

The SQLite database is persisted at `./data/macrotrackr.db`.

### Build from source instead of pulling images

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

This mode is useful for contributors and local image customization.

### First-run bootstrap

1. Start the stack.
2. Open `http://localhost:5173/register`.
3. Create the initial local user account.

## Backup, Restore, and Upgrade (Self-host)

### Backup

```bash
cp data/macrotrackr.db data/macrotrackr.db.backup
```

### Restore

```bash
cp data/macrotrackr.db.backup data/macrotrackr.db
```

### Upgrade

```bash
git pull
docker compose pull
docker compose up -d
```

## Deployment Notes

- Frontend deployment guide: `frontend/docs/DEPLOYMENT.md`
- This public repository focuses on self-hosted deployments.
- Managed hosting infrastructure is maintained in a separate private repository.

## Project Layout

```text
backend/   Bun + Elysia API, SQLite schema, auth modules
frontend/  React + Vite app (local auth UI)
docs/      public project docs
```
 
 
