# MacroTrackr Open-Source Migration Plan

## Summary

- Publish the app as AGPLv3 and use a Ghost/Plausible-style model: the public repo contains the full core product, self-hosters can run it themselves, and you charge for managed hosting, upgrades, backups, support, and operational convenience rather than a self-host license key. Benchmarks: [Ghost](https://docs.ghost.org/hosting), [Plausible](https://plausible.io/self-hosted-web-analytics). This plan explicitly avoids the Chatwoot/n8n/Cal.com pattern of gated self-host licenses or enterprise keys: [Chatwoot](https://www.chatwoot.com/pricing/self-hosted-plans), [n8n pricing](https://n8n.io/pricing/), [n8n self-hosting](https://docs.n8n.io/hosting/), [Cal.com](https://cal.com/docs/self-hosting/license-key).
- The main blockers from the repo sweep are architectural: backend startup currently hard-requires Clerk, Stripe, Resend, and JWT env vars; runtime services eagerly initialize hosted-only integrations; the app hardcodes `macrotrackr.com` URLs/emails/legal text; the repo lacks top-level OSS/community docs; there are tracked internal/generated artifacts; `/metrics` is public; and the frontend quality bar is not public-release ready.
- Current verification status: backend TypeScript, ESLint, and tests passed locally; frontend TypeScript passed; frontend ESLint reported 124 warnings; frontend Vitest reported 19 failing suites and 31 failing tests, mostly from stale expectations, missing provider wrappers, unresolved imports, and missing browser API mocks.

## Public Interfaces

- Replace the current provider-coupled env contract with provider-agnostic settings such as `APP_URL`, `PUBLIC_APP_NAME`, `SUPPORT_EMAIL`, `AUTH_MODE`, `BILLING_MODE`, `EMAIL_MODE`, `ANALYTICS_MODE`, `DATABASE_MODE`, and `ENABLE_METRICS`, with provider-specific vars only required when that mode is enabled. `backend/src/config.ts` must stop requiring Clerk/Stripe/Resend keys for self-hosted startup.
- Split user identity and billing state away from Clerk/Stripe-specific fields. `users` remains canonical; provider linkage moves behind adapters or provider tables; `subscription_status` becomes a generic plan/entitlements model; `/api/user/me` stops exposing Stripe-specific fields like `hasStripeCustomer` as part of the core contract.
- Turn provider-specific routes into optional adapters. `/api/auth/clerk-sync` becomes a Clerk-only integration path in managed mode; core auth flows get generic login/onboarding endpoints for `local` or `oidc`; billing routes are disabled or hidden when `BILLING_MODE=disabled`.
- Parameterize all hosted branding and legal surface. Frontend SEO constants, blog CTAs, email templates, legal pages, support addresses, and password-reset links must read config instead of hardcoded `macrotrackr.com` values.

## Implementation Changes

- Create two supported runtime profiles. `self-hosted` defaults to no SaaS dependencies, local auth or OIDC, billing off, analytics off, SMTP optional, and a documented single-node database path. `managed` enables Clerk, Stripe, PostHog, Resend, and hosted defaults. `backend/src/services/runtime.ts` must lazily initialize provider services so the app boots cleanly when a provider is off.
- Keep SQLite as the first supported self-hosted default, but document it as single-node only and plan a second phase for Postgres if hosted scale needs it. Add a first-run bootstrap path for creating the initial admin/user, predictable migrations, backup/restore commands, and a persistent volume story that works in Docker Compose.
- Ship real self-hosting infrastructure: `Dockerfile`s, `docker-compose.yml`, `.dockerignore`, backend and frontend `.env.example` files, and a minimal reverse-proxy/TLS guide. Replace the current PM2/SSH/server-specific deployment story with sanitized templates; keep company-only hosted deployment details private.
- Remove or sanitize repo content that should not ship publicly. At minimum: scrub sample secrets and hosted-only instructions from `backend/docs/WEBHOOK_SETUP.md`; remove or relocate `docs/launch/*`, `docs/analysis/*`, `.github/IMPROVEMENTS_REQUIRED.md`, `.github/dev-commands.md`, `.kilocode/skills/macro-tracker-design/SKILL.md`, `backend/src/db/schema.ts.bak`, `test-results/.last-run.json`, and other internal helper material; make `.gitignore` match the intended policy for generated files like `frontend/src/routeTree.gen.ts`.
- Add OSS/legal/community scaffolding: top-level `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, release/versioning docs, and a trademark/branding policy so the code is open while `MacroTrackr` name/logo remain protected for your hosted service.
- Separate hosted-service legal documents from project legal documents. Keep the repo focused on software licensing, contributions, security reporting, and self-host docs; move hosted privacy policy, terms, DPA, subprocessors, billing terms, and SLAs into the managed service surface with configurable links from the app.
- Harden public defaults. Lock `/metrics` behind a key or disable it by default; reduce `/health` detail; enable proper security headers and trusted-proxy handling; finish auth audience checks; document secret rotation; make telemetry opt-in; and replace in-memory rate limiting with a documented production strategy for multi-instance deployments.
- Add secret and artifact hygiene to CI. Include secret scanning, dependency auditing, and checks that reject tracked env files, local DB files, build artifacts, test reports, and backup files.
- Normalize release automation and branch policy. Remove `main`/`master`/`develop` drift across workflows, keep public CI separate from private hosted deployment automation, and remove `private: true` where publishing is intended.

## Test Plan

- Self-host install test: fresh clone, copy `.env.example`, run Docker Compose, create first admin/user, sign in without Clerk/Stripe, persist data across restarts, and validate backup/restore.
- Managed profile test: boot with Clerk, Stripe, Resend, and PostHog enabled; verify auth sync, billing checkout/portal, webhooks, email flows, and feature visibility.
- Migration test: upgrade an existing managed database into the new provider-neutral schema without data loss; verify old users, subscriptions, and reporting data still load correctly.
- Security test: confirm no public metrics without auth, health endpoints do not leak sensitive details, example docs contain no usable keys, telemetry is disabled by default in OSS, and unsupported providers fail closed with clear errors.
- Quality gate before opening the repo: keep backend green, reduce frontend ESLint warnings to an agreed budget, and fix the current frontend failures around unresolved imports, provider wrappers, browser API mocks, stale expectations, and component contract drift until public CI passes end-to-end.

## Assumptions

- The public project is AGPLv3, and you retain `MacroTrackr` branding as a trademark rather than using a self-host license key.
- Self-hosters receive the full core product; your paid offering is managed SaaS, support, operations, compliance, upgrades, backups, and convenience, not a crippled community edition.
- Sanitized self-host ops docs stay in the public repo, but company-specific launch plans, internal analyses, and hosted-deploy runbooks do not.
- SQLite remains the initial supported self-host database; Postgres support is a follow-on scale project, not a precondition for the OSS launch.
