# Organic Discovery — Submission Content

Copy-paste-ready content for external directories. All URLs verified as of 2026-08-11.

## 1. awesome-selfhosted — Nutrition list

PR against `awesome-selfhosted/awesome-selfhosted`, in the **Nutrition** list section (alphabetical). Entry format follows their `[name](url) - description. license, platform` convention:

```
- [Macro Trackr](https://github.com/arogan178/macrotrackr) - Self-hosted calorie and macro tracker with meal logging, barcode search, habits, and reporting. AGPL-3.0, Docker, Node.js
```

Notes:
- License line must say `AGPL-3.0` exactly (their linter checks license names).
- Platform tags they accept: `Docker`, `Node.js`, `Go`, etc. Keep to what's in the README.
- Link must be the GitHub repo, not the hosted site.

## 2. AlternativeTo — MyFitnessPal alternative

Listing at `https://alternativeto.net/software/macrotrackr/`:

**Name:** MacroTrackr

**Description (blurb):**
> Open source macro and calorie tracker. Log meals by barcode or search, track protein/carbs/fat targets, habits, and weekly trends — self-host it or use the free hosted version. No ads, no data reselling, no paywalled basics.

**Tags:** calorie counter, macro tracker, nutrition tracker, meal tracker, self-hosted, open source

**Link:** https://github.com/arogan178/macrotrackr

## 3. Docker Hub mirror

Compose defaults to GHCR (`ghcr.io/arogan178/macrotrackr-backend:latest`, `ghcr.io/arogan178/macrotrackr-frontend:latest`). Mirror to Docker Hub for visibility:

```bash
# one-time login, then per release:
docker buildx build --platform linux/amd64,linux/arm64 \
  -f backend/Dockerfile -t arogan178/macrotrackr-backend:latest . --push
docker buildx build --platform linux/amd64,linux/arm64 \
  -f frontend/Dockerfile -t arogan178/macrotrackr-frontend:latest . --push
```

**Docker Hub repo description (README tab):**

> # MacroTrackr
>
> Self-hosted calorie and macro tracker: meal logging with barcode search, macro targets, habits, and weekly reporting. AGPL-3.0, no telemetry required.
>
> Run with Docker Compose — see https://github.com/arogan178/macrotrackr#self-hosting-with-docker-compose
>
> Two images: `macrotrackr-backend` (API + SQLite) and `macrotrackr-frontend` (web UI). Hosted version: https://macrotrackr.com

## 4. Open Food Facts — apps list

Submit at https://world.openfoodfacts.org/apps (uses their GitHub form):

**App name:** MacroTrackr
**Platform:** Web (PWA) + Android/iOS via Capacitor
**Description:** Open source macro tracker that logs foods by Open Food Facts barcode search. Free and self-hostable; no account needed for searching.
**Link:** https://github.com/arogan178/macrotrackr
**Source code:** https://github.com/arogan178/macrotrackr (AGPL-3.0)

## Checklist

- [ ] awesome-selfhosted PR merged → watch stars/link-referrers
- [ ] AlternativeTo listing approved
- [ ] Docker Hub org/repos created, images pushed, description set
- [ ] OFF apps list entry live
- [ ] Add badge to README when listing is live (e.g. "Listed on AlternativeTo")
