# MacroTrackr

MacroTrackr is a privacy-respecting macro tracker you can use as a managed app or run on your own infrastructure. Log meals, set macro goals, follow weight trends, and import history from popular nutrition trackers without being locked into one host.

[Use MacroTrackr](https://macrotrackr.com/register) · [Import your history](https://macrotrackr.com/migrate) · [Try the free calculators](https://macrotrackr.com/tools) · [View pricing](https://macrotrackr.com/pricing) · [Self-host](docs/self-hosting.md)

## Why MacroTrackr

- Start fresh or import existing tracking history.
- Keep everyday logging focused on macros instead of unnecessary complexity.
- Use the managed service for convenience or self-host the AGPLv3 code with local authentication.
- Keep self-hosted analytics and billing disabled by default.

The self-hosted backend uses SQLite with local authentication. Managed hosting infrastructure is maintained separately.

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

## 1-Click App Store Manifests & Homelab Templates

MacroTrackr supports 1-click deployments across popular self-hosted homelab platforms:

- **Unraid**: Community Applications template (`templates/unraid/macrotrackr.xml`)
- **CasaOS / ZimaOS**: App Store manifest and compose (`templates/casaos/docker-compose.yml`, `templates/casaos/macrotrackr.json`)
- **Umbrel**: Umbrel App Store package (`templates/umbrel/umbrel-app.yml`, `templates/umbrel/docker-compose.yml`)
- **Cosmos Cloud**: ServApp template (`templates/cosmos/servapp.json`)
- **TrueNAS SCALE**: Electric Eel / Dockge compose template (`templates/truenas/docker-compose.yml`)

See the full [Self-Hosting & Templates Guide](docs/self-hosting.md) for detailed platform-specific installation steps, volume configuration, and environment parameters.

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
- backend API: not published to the host. It is reachable only from the frontend container,
  which proxies `/api`. Exposing it directly would let clients bypass nginx and forge the
  `X-Real-IP` header that per-client rate limiting relies on (`TRUST_PROXY`). If you need
  direct access, add a `ports` mapping and set `TRUST_PROXY=false`.

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

## Star History

<a href="https://www.star-history.com/?repos=arogan178%2Fmacrotrackr&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=arogan178/macrotrackr&type=date&theme=dark&legend=top-left&sealed_token=8p5V61Qf5xP9miyv_oM22DfQxzPMX1C-MVFJ8QDQAEerJxGDgN5H5o1cuWktX9gWRZ1lS41s2b35_EbITfME0oQofLbSiCf0eOYS4VsZEJAOMm26qxnXp8K6bdkGdm9dmP66TB5bU6HW9SyShWwfqMTDgInPDrpH3iz_JkEkdribHGPXQd9YhHUI83i8" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=arogan178/macrotrackr&type=date&legend=top-left&sealed_token=8p5V61Qf5xP9miyv_oM22DfQxzPMX1C-MVFJ8QDQAEerJxGDgN5H5o1cuWktX9gWRZ1lS41s2b35_EbITfME0oQofLbSiCf0eOYS4VsZEJAOMm26qxnXp8K6bdkGdm9dmP66TB5bU6HW9SyShWwfqMTDgInPDrpH3iz_JkEkdribHGPXQd9YhHUI83i8" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=arogan178/macrotrackr&type=date&legend=top-left&sealed_token=8p5V61Qf5xP9miyv_oM22DfQxzPMX1C-MVFJ8QDQAEerJxGDgN5H5o1cuWktX9gWRZ1lS41s2b35_EbITfME0oQofLbSiCf0eOYS4VsZEJAOMm26qxnXp8K6bdkGdm9dmP66TB5bU6HW9SyShWwfqMTDgInPDrpH3iz_JkEkdribHGPXQd9YhHUI83i8" />
 </picture>
</a>
 
