# MacroTrackr Open-Source Migration Plan v2

## Summary

- Replace this file with a decision-complete roadmap for an AGPLv3, SQLite-only OSS release that supports two runtime profiles: `managed` and `self-hosted`.
- Keep the core tracker fully open source, disable billing in self-hosted mode by design, and preserve managed monetization through hosted operations and convenience.
- Lock local auth to Bun password hashing plus DB-backed sessions with secure cookies. Do not use Lucia. Do not use JWT-based self-hosted auth.

## Runtime Profiles

| Profile | Auth | Billing | Analytics | Email | Database | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `managed` | `clerk` | `managed` | `posthog` or `disabled` | `resend` or `smtp` | SQLite | Current hosted product profile |
| `self-hosted` | `local` | `disabled` | `disabled` by default | `smtp` or `disabled` | SQLite | Single-node only, no hosted SaaS dependency required |

## Runtime Behavior Matrix

| Mode Combination | Providers Mounted | Backend Routes | Frontend Pages/UI | Billing Surface |
| --- | --- | --- | --- | --- |
| `managed + clerk + managed billing` | `ClerkProvider`, optional `PostHogProvider` | Clerk auth routes, billing routes, webhooks, managed integrations | Current Clerk auth pages, pricing page, billing settings, hosted defaults | Enabled |
| `self-hosted + local + billing disabled` | No Clerk provider, no PostHog by default | Local auth routes, no Stripe routes, no Clerk-only routes, no billing webhooks | Local login/register/reset-password flows, no billing tab, no hosted-only UI | Hidden and unmounted |

### Settings/UI Matrix

| Surface | Managed | Self-Hosted |
| --- | --- | --- |
| Billing settings tab | Visible | Hidden |
| Pricing page | Visible | Optional marketing page only, no checkout actions |
| Password change flow | Clerk mutation | Local auth endpoint |
| `ClerkTokenSync` | Mounted | Not mounted |
| `ClerkProvider` | Mounted | Not mounted |
| Billing API hooks | Enabled | Must not run |
| Hosted legal/support links | Allowed | Replaced by config-driven self-host defaults |

Acceptance:
- The repo contains one authoritative table mapping runtime modes to providers, routes, pages, and tabs.

## Canonical Configuration Contract

### Core Settings

- `APP_MODE=managed|self-hosted`
- `AUTH_MODE=clerk|local`
- `BILLING_MODE=managed|disabled`
- `ANALYTICS_MODE=posthog|disabled`
- `EMAIL_MODE=resend|smtp|disabled`
- `APP_URL`
- `PUBLIC_APP_NAME`
- `SUPPORT_EMAIL`
- `ENABLE_METRICS=true|false`

### Provider Settings

These are only required when the corresponding mode is enabled:

- Clerk:
  - `CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SECRET`
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID_MONTHLY`
  - `STRIPE_PRICE_ID_YEARLY`
- PostHog:
  - `VITE_PUBLIC_POSTHOG_KEY`
  - `VITE_PUBLIC_POSTHOG_HOST`
- Email:
  - `RESEND_API_KEY`
  - SMTP variables if `EMAIL_MODE=smtp`

### Branding Contract

These values are the single source of truth for runtime branding:

- App name: `PUBLIC_APP_NAME`
- Canonical URL: `APP_URL`
- Support email: `SUPPORT_EMAIL`
- Legal links: config-backed URLs or route constants derived from `APP_URL`
- Sender/from branding: derived from `PUBLIC_APP_NAME` plus environment configuration
- Logo/asset branding: centralized frontend constants, no hardcoded production domain assumptions

Acceptance:
- Self-hosted profile boots with no Clerk, Stripe, Resend, or PostHog secrets.
- Provider variables are validated only when their runtime mode is active.

## Phase 0: Publishability Audit

Goal:
- Remove or sanitize everything that makes the repo unsafe or noisy for a public OSS release before large refactors begin.

### Delete

- `docs/launch/*`
- `docs/analysis/*`
- `.github/IMPROVEMENTS_REQUIRED.md`
- `.github/dev-commands.md`
- `.kilocode/skills/macro-tracker-design/SKILL.md`
- `backend/src/db/schema.ts.bak`
- `test-results/.last-run.json`
- Any tracked local DB artifacts if present in git history or current tree

### Sanitize

- `backend/docs/WEBHOOK_SETUP.md`
- `.github/README_DEPLOY.md`
- deploy workflows
- sample env docs
- hardcoded support or hosted-domain references
- company-specific deploy or launch language

### Keep Public

- dependency governance docs
- frontend structure docs
- sanitized self-host deployment docs
- security, contribution, and community docs

Acceptance:
- Repo has no tracked secrets, local DB artifacts, internal launch material, or company-only execution docs.
- Secret scanning passes.
- Domain and branding audit is complete.

## Phase 1: Runtime Modes and Config

Goal:
- Decouple startup from SaaS providers and establish one consistent runtime contract.

Actions:
- Refactor `backend/src/config.ts` to support the canonical configuration contract.
- Refactor `backend/src/services/runtime.ts` so Stripe, email, analytics, and provider-specific services are lazily initialized only when needed.
- Add managed and self-hosted `.env.example` files for root/backend/frontend.
- Make frontend boot conditional so Clerk and PostHog are only mounted when enabled.
- Document self-hosted as SQLite-only and single-node.

Acceptance:
- Self-hosted boot works with SQLite and local config only.
- Managed boot still works with Clerk, Stripe, Resend, and optional PostHog.

## Phase 2A: Backend Local Auth

Goal:
- Add a first-party local auth stack for self-hosted mode using server-side sessions and secure cookies.

### Session Schema

Add `sessions` table:

- `id`
- `user_id`
- `secret_hash`
- `created_at`
- `expires_at`
- `last_used_at`
- optional `ip`
- optional `user_agent`

Preferred addition:
- `password_reset_tokens` table for reset flows rather than continuing inline token storage forever.

Compatibility note:
- Existing `users.password_reset_token` and `users.password_reset_expires` may remain temporarily during migration, but the long-term direction is table-based reset tokens.

### Cookie Contract

- Cookie name: `mt_session`
- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- `Path=/`

### Session Policy

- Sliding session expiry
- 30-day lifetime
- Rotate session on:
  - login
  - password change
  - password reset
- Support:
  - logout current session
  - logout all sessions

### Local Auth Routes

Mounted only in `AUTH_MODE=local`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`

### Clerk Routes

Mounted only in managed mode:

- `/api/auth/clerk-sync`
- Clerk webhooks
- Clerk-specific flows and middleware dependencies

Acceptance:
- Register, login, logout, logout-all, session validation, password reset, and password change all work in local mode.

## Phase 2B: Frontend Auth Mode Switching

Goal:
- Make the frontend choose between managed Clerk auth and self-hosted local auth without provider leakage.

Actions:
- Update `frontend/src/main.tsx` so `ClerkProvider` and `ClerkTokenSync` mount only in `AUTH_MODE=clerk`.
- Replace unconditional Clerk hook assumptions in auth/bootstrap code with mode-aware adapters.
- Make login/register/reset-password pages mode-aware:
  - managed mode: current Clerk UI
  - self-hosted mode: native forms using local auth endpoints
- Ensure auth state hooks in local mode resolve from session endpoints and secure cookies.

Acceptance:
- Frontend auth smoke tests pass in both modes.
- No Clerk provider is mounted in self-hosted mode.

## Phase 2C: Auth Middleware Parity

Goal:
- Keep one normalized authenticated user contract for all protected routes, regardless of auth provider.

Actions:
- Convert current Clerk-specific auth middleware into a provider adapter.
- Resolve the same normalized authenticated user shape from:
  - Clerk session in managed mode
  - local session cookie in self-hosted mode
- Ensure downstream route handlers are auth-provider agnostic.
- Keep provider-specific routes gated at mount time, not via ad hoc branching inside every handler.

Acceptance:
- Protected route tests pass in both modes with the same route contracts.

## Phase 3: Branding, Legal, and Interface Abstraction

Goal:
- Remove hosted-brand coupling from runtime code and make all public-facing strings/config values environment-driven.

Actions:
- Replace hardcoded `macrotrackr.com`, support emails, password-reset URLs, sender addresses, canonical URLs, legal links, and blog CTA links with config-backed values.
- Ensure `GET /api/user/me` returns generic user and plan state rather than Stripe-specific transport details in self-hosted mode.
- Move hosted-service privacy/terms out of the OSS repo or clearly separate them from OSS/community documentation.
- Document compatibility handling for current `users.password` values, especially legacy managed rows like `"clerk-auth"`.

Acceptance:
- Grep-based audit finds no hardcoded hosted production domain in runtime code except approved defaults/examples.
- User interfaces expose provider-neutral contracts.

## Phase 4: Self-Hosting and OSS Scaffolding

Goal:
- Make the repository legally, operationally, and ergonomically ready for public self-hosting.

Actions:
- Add:
  - `LICENSE`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `SUPPORT.md`
  - trademark policy
- Add:
  - `Dockerfile`s
  - `docker-compose.yml`
  - `.dockerignore`
- Define supported deployment story:
  - one-command local start
  - one-command production-ish compose start
  - persistent SQLite volume path
  - reverse-proxy/TLS expectation
  - backup command
  - restore command
  - upgrade command
  - first-run bootstrap for initial admin/user creation

Acceptance:
- Fresh clone self-host install works without manual code changes.

## Billing and Route Policy

- `BILLING_MODE=disabled` must unmount billing routes entirely in self-hosted mode.
- Recommended behavior: return `404` for billing endpoints that do not exist in self-hosted mode.
- Frontend must hide billing navigation and billing-dependent views when billing is disabled.
- No Stripe routes or webhook handlers should be mounted in self-hosted mode.

Acceptance:
- Billing-hidden UI tests pass.
- Disabled-billing route tests confirm route unmounting or `404` behavior.

## Public Interface Normalization

- Normalize auth and user interfaces so provider-specific fields are not part of the core contract.
- `GET /api/user/me` must return:
  - generic identity fields
  - generic plan/subscription state
  - no Stripe transport details in self-hosted mode
- Document exact compatibility handling for legacy managed users and placeholder password values.

## Test Plan

### Phase 0

- secret scan
- artifact scan
- domain/branding scan
- internal-docs inventory

### Phase 1

- self-hosted boot test with only SQLite and local env examples

### Phase 2A

- register/login/logout/session rotation/logout-all
- password reset
- password change

### Phase 2B

- frontend auth smoke tests in both modes
- provider mounting tests
- route visibility tests

### Phase 2C

- middleware parity tests proving identical protected-route behavior under Clerk and local session auth

### Phase 3

- branding grep tests
- billing-hidden UI tests
- disabled-billing route tests

### Phase 4

- Docker Compose install
- persistent volume restart
- backup/restore
- first-run bootstrap

### Release Gate

- backend green
- frontend typecheck green
- frontend lint warnings reduced to an agreed threshold
- current failing frontend Vitest groups fixed by category:
  - unresolved imports
  - missing provider wrappers
  - missing browser mocks like `matchMedia`
  - stale expectations
  - component prop/contract drift

## Assumptions

- SQLite remains the only supported database for this migration. Postgres is explicitly deferred and removed as an active planning branch.
- Self-hosted mode is local-auth only in v1. OIDC and SAML are out of scope.
- Billing is intentionally disabled for self-hosters as part of the COSS strategy.
- OSS repo publication happens only after the release gate passes, not incrementally during the refactor.
