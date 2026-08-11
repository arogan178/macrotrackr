# Organic Discovery — Submission Content

Copy-paste-ready content for external directories. Checked 2026-08-11.

The five free calculators at `/tools` (TDEE, BMR, macro, weight loss, protein) are the
only part of the product that needs no account, so they carry every submission blurb.

## 1. awesome-selfhosted — Health and Fitness

`awesome-selfhosted/awesome-selfhosted-data` takes one YAML file per project at
`software/<kebab-case-name>.yml` — not a line in the README. Submitted as
[PR #2886](https://github.com/awesome-selfhosted/awesome-selfhosted-data/pull/2886):

```yaml
name: MacroTrackr
website_url: https://macrotrackr.com
source_code_url: https://github.com/arogan178/macrotrackr
description: Calorie and macro tracker with meal logging, barcode search, habits, and reporting (alternative to MyFitnessPal).
licenses:
  - AGPL-3.0
platforms:
  - Nodejs
  - Docker
tags:
  - Health and Fitness
```

Notes:

- `licenses`, `platforms`, and `tags` values must match an existing file in their
  `licenses.yml`, `platforms/`, and `tags/` directories. `AGPL-3.0`, `Nodejs`,
  `Docker`, and `Health and Fitness` all exist.
- Their guidelines ban redundant words in descriptions (_open-source_, _free_,
  _self-hosted_) — the list already implies all three.
- Comparisons belong in the description as `(alternative to $PRODUCT)`.
- `website_url` is the project's own site; `source_code_url` is the repo. The PR as
  submitted has the repo in both — worth a follow-up commit.
- **Release-age risk:** they require the first release to be more than 4 months old.
  Our GitHub releases were all backfilled on 2026-04-28, which is only ~3.5 months
  ago, so the PR may draw their "no tagged releases" canned reply. The underlying git
  tags go back to v1.0.0 on 2025-04-16 — say so in a PR comment if it comes up.

## 2. AlternativeTo — MyFitnessPal alternative

Listing at `https://alternativeto.net/software/macrotrackr/` (live once approved):

**Name:** MacroTrackr

**Description (blurb):**

> Open source macro and calorie tracker. Log meals by barcode or search, track
> protein/carbs/fat targets, habits, and weekly trends — self-host it or use the free
> hosted version. Free TDEE, BMR, macro, and protein calculators run without an
> account. No ads, no data reselling, no paywalled basics.

**Tags:** calorie counter, macro tracker, nutrition tracker, meal tracker, self-hosted, open source

**Link:** https://github.com/arogan178/macrotrackr

## 3. Docker Hub mirror

Compose defaults to GHCR (`ghcr.io/arogan178/macrotrackr-backend:latest`,
`ghcr.io/arogan178/macrotrackr-frontend:latest`). Mirror to Docker Hub for visibility.

Do this in `.github/workflows/publish-images.yml` rather than by hand, so the mirror
cannot drift from releases: add a second `docker/login-action` for `docker.io`, a
second `images:` line to each `docker/metadata-action`, and
`platforms: linux/amd64,linux/arm64` to both build steps. Needs `DOCKERHUB_USERNAME`
and `DOCKERHUB_TOKEN` repo secrets.

Note the images we publish today are **amd64 only** — the workflow sets no
`platforms:`. arm64 matters here, since Raspberry Pi and NAS users are most of the
traffic awesome-selfhosted sends. Fix that in the same change.

**Docker Hub repo description (README tab):**

> # MacroTrackr
>
> Self-hosted calorie and macro tracker: meal logging with barcode search, macro
> targets, habits, and weekly reporting. AGPL-3.0, no telemetry required.
>
> Run with Docker Compose — see https://github.com/arogan178/macrotrackr#self-hosting-with-docker-compose
>
> Two images: `macrotrackr-backend` (API + SQLite) and `macrotrackr-frontend` (web UI). Hosted version: https://macrotrackr.com

## 4. Open Food Facts — apps list

`https://world.openfoodfacts.org/apps` now 404s. The reusers/apps list lives on their
wiki (https://wiki.openfoodfacts.org, behind Anubis bot protection, so open it in a
real browser), and the practical route to getting listed is their Slack at
https://slack.openfoodfacts.org — introduce the app in the relevant channel and ask
where reusers are catalogued now.

**App name:** MacroTrackr
**Platform:** Web (PWA) + Android/iOS via Capacitor
**Description:** Macro tracker that logs foods by Open Food Facts barcode search, with free nutrition calculators that need no account.
**Link:** https://github.com/arogan178/macrotrackr
**Source code:** https://github.com/arogan178/macrotrackr (AGPL-3.0)

Do not claim food search works without an account — `/api/macros/search` sits behind
the auth middleware (`backend/src/app.ts`), and it is not in `AUTH_EXEMPT_PATHS`
(`backend/src/middleware/clerk-auth.ts`). The `/tools` calculators are the
account-free surface.

## Checklist

- [x] awesome-selfhosted PR submitted (PR #2886: https://github.com/awesome-selfhosted/awesome-selfhosted-data/pull/2886) → watch stars/link-referrers when merged
- [ ] Follow up on PR #2886: point `website_url` at https://macrotrackr.com, add the MyFitnessPal comparison to the description
- [x] AlternativeTo listing submitted (pending review/approval)
- [x] Docker Hub repos created (public), `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` secrets added under Actions, `publish-images.yml` mirrors GHCR + Docker Hub for `linux/amd64,linux/arm64`
- [ ] Docker Hub short descriptions + README tab filled in (see blurb above)
- [ ] First `master` push verified: both registries tagged, `docker manifest inspect` shows two architectures
- [ ] OFF apps list entry live
- [ ] Add badge to README when listing is live (e.g. "Listed on AlternativeTo")
