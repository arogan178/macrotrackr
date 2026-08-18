# MacroTrackr Self-Hosting & 1-Click App Templates

MacroTrackr is designed for effortless self-hosting on homelab servers, NAS appliances, and cloud VMs. It uses a lightweight SQLite database and local authentication without requiring external authentication providers or cloud services.

---

## 1-Click App Store Templates

We provide ready-to-use manifests for popular homelab operating systems and container managers:

| Platform | Manifest Path | Quick Install Method |
| :--- | :--- | :--- |
| **Unraid** | `templates/unraid/macrotrackr.xml` | Community Applications XML template |
| **CasaOS / ZimaOS** | `templates/casaos/docker-compose.yml` | CasaOS Custom App / AppStore JSON |
| **Umbrel** | `templates/umbrel/umbrel-app.yml` | Umbrel Community App Store / CLI |
| **Cosmos Cloud** | `templates/cosmos/servapp.json` | Cosmos ServApp Import |
| **TrueNAS SCALE** | `templates/truenas/docker-compose.yml` | Native Compose / Dockge |
| **Docker Compose** | `docker-compose.yml` | Standard `docker compose up -d` |

---

## Platform Guides

### 1. Unraid (Community Applications)

1. Save the XML template file `templates/unraid/macrotrackr.xml` to `/boot/config/plugins/dockerMan/templates-user/my-MacroTrackr.xml` on your Unraid flash drive, or add it via Community Applications repository.
2. In the Unraid WebUI, navigate to **Docker** > **Add Container** and select the **MacroTrackr** template.
3. Configure the container parameters:
   - **Host Port**: `5173` (or any available port on your Unraid server)
   - **Appdata Storage Path**: `/mnt/user/appdata/macrotrackr/data` (mapped to `/data`)
   - **APP_URL**: `http://<UNRAID-IP>:5173` (or your reverse-proxy domain)
4. Click **Apply** to deploy.

---

### 2. CasaOS & ZimaOS

#### Method A: Custom App Install (Compose)
1. In your CasaOS dashboard, click **+** (Install a customized app).
2. Click **Import** in the top right corner and paste the contents of `templates/casaos/docker-compose.yml`.
3. Verify that the volume path points to `/DATA/AppData/macrotrackr/data`.
4. Click **Submit** to install.

#### Method B: CasaOS AppStore Manifest
Add `templates/casaos/macrotrackr.json` to your custom CasaOS AppStore list.

---

### 3. Umbrel

1. Clone or copy the `templates/umbrel` folder into your custom Umbrel app repository or to your Umbrel server at `~/umbrel/apps/macrotrackr/`:
   ```bash
   mkdir -p ~/umbrel/apps/macrotrackr
   cp templates/umbrel/umbrel-app.yml ~/umbrel/apps/macrotrackr/umbrel-app.yml
   cp templates/umbrel/docker-compose.yml ~/umbrel/apps/macrotrackr/docker-compose.yml
   ```
2. Umbrel automatically maps `${APP_DATA_DIR}/data` for persistent SQLite storage.
3. Install and start the app via the Umbrel UI or CLI:
   ```bash
   umbrel app install macrotrackr
   ```
4. Access MacroTrackr at `http://umbrel.local:5173` or your configured Umbrel hostname.

---

### 4. Cosmos Cloud

1. In the Cosmos UI, navigate to **ServApps** > **Import**.
2. Paste the JSON from `templates/cosmos/servapp.json`.
3. Cosmos SmartShield will automatically provision routes and SSL proxying to the frontend container port `80`.
4. The database is persisted at `{DATA_PATH}/macrotrackr/data`.

---

### 5. TrueNAS SCALE (Electric Eel 24.10+ / Dockge)

1. Navigate to **Apps** > **Discover Apps** > **Custom App** (or use Dockge).
2. Select **Docker Compose** and paste `templates/truenas/docker-compose.yml`.
3. Set your dataset volume mapping (e.g., `/mnt/tank/apps/macrotrackr/data:/data`).
4. Ensure appropriate permissions on the dataset for UID `1000` / GID `1000`.
5. Deploy the application.

---

### 6. Standard Docker Compose

Run with the root `docker-compose.yml`:

```bash
mkdir -p data
docker compose pull
docker compose up -d
```

---

## Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_PATH` | `/data/macrotrackr.db` | Absolute path to SQLite database file |
| `PORT` | `3000` | Internal backend HTTP port |
| `HOST` | `0.0.0.0` | Binding IP address for the backend |
| `APP_URL` | `http://localhost:5173` | Public URL for the frontend application |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (comma-separated for multiples) |
| `TRUST_PROXY` | `true` | Set `true` when behind reverse proxy for rate-limit client IP resolution |
| `APP_MODE` | `self-hosted` | Set to `self-hosted` for standalone local deployment |
| `AUTH_MODE` | `local` | Use `local` for built-in database auth |
| `BILLING_MODE` | `disabled` | Set to `disabled` for self-hosted instances |
| `ANALYTICS_MODE`| `disabled` | Set to `disabled` for zero telemetry |
| `EMAIL_MODE` | `disabled` | Set to `disabled`, `smtp`, or `resend` |
| `ENABLE_METRICS`| `false` | Enable Prometheus `/metrics` endpoint |
| `METRICS_API_KEY` | *(optional)* | Shared secret for securing `/metrics` endpoint |

### SMTP Configuration (Optional)

If `EMAIL_MODE=smtp` is enabled:

| Variable | Description |
| :--- | :--- |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port (e.g., `587` or `465`) |
| `SMTP_USER` | SMTP authentication username |
| `SMTP_PASS` | SMTP authentication password |
| `SMTP_FROM` | Sender email address (`noreply@yourdomain.com`) |

---

## Storage & Permissions

MacroTrackr stores all application data in a single SQLite database inside the `/data` container volume.

- **Internal Directory**: `/data`
- **Database File**: `/data/macrotrackr.db`
- **User Permissions**: The backend container runs as non-root user `bun` (UID: `1000`, GID: `1000`).

Ensure your host storage directory has write permissions:

```bash
mkdir -p ./data
chown -R 1000:1000 ./data
chmod 755 ./data
```

---

## Reverse Proxy & SSL Setup

When exposing MacroTrackr via HTTPS behind a reverse proxy (e.g. Nginx, Caddy, Traefik, NPM, Cloudflare Tunnels):

1. Proxy traffic to the **frontend** service (port `80` internal / `5173` host).
2. Set `APP_URL` and `CORS_ORIGIN` to your external HTTPS URL (e.g. `https://macros.example.com`).
3. Ensure headers `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` are passed.
4. Keep `TRUST_PROXY=true` in backend configuration so client IP-based rate limiting operates accurately.

---

## Backup and Migration

### Backup
```bash
# Safely snapshot the SQLite database
cp data/macrotrackr.db data/macrotrackr-$(date +%Y%m%d%H%M%S).db.bak
```

### Restore
```bash
docker compose down
cp data/macrotrackr.db.bak data/macrotrackr.db
docker compose up -d
```
