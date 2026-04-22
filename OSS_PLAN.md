# MacroTrackr OSS Release Plan (v2)

## Summary

- Replace `OSS_PLAN.md` with a decision-complete roadmap for an AGPLv3, SQLite-only OSS release with two runtime profiles: `managed` and `self-hosted`.
- Keep the core tracker fully open source. In `self-hosted`, billing is disabled by design. In `managed`, monetization is preserved through hosted operations, support, upgrades, backups, and convenience.
- Local auth is Bun password hashing plus DB-backed sessions with secure cookies. Do not use Lucia. Do not use JWT-based self-hosted auth.
- OSS publication happens only after the release gate passes.

## Locked Decisions

- License: AGPLv3.
- Database scope for this migration: SQLite only.
- Supported runtime profiles in v1:
  - `managed`: `AUTH_MODE=clerk`, `BILLING_MODE=managed`
  - `self-hosted`: `AUTH_MODE=local`, `BILLING_MODE=disabled`
- Self-hosted auth scope in v1: local auth only (OIDC/SAML deferred).
- Billing in self-hosted: billing routes are unmounted and return `404`.

## Runtime Modes and Config (Phase 1 Contract)

### Canonical env contract

| Variable          | Allowed values                   | Required |
| ----------------- | -------------------------------- | -------- |
| `APP_MODE`        | `managed` \| `self-hosted`       | always   |
| `AUTH_MODE`       | `clerk` \| `local`               | always   |
| `BILLING_MODE`    | `managed` \| `disabled`          | always   |
| `ANALYTICS_MODE`  | `posthog` \| `disabled`          | always   |
| `EMAIL_MODE`      | `resend` \| `smtp` \| `disabled` | always   |
| `APP_URL`         | URL                              | always   |
| `PUBLIC_APP_NAME` | string                           | always   |
| `SUPPORT_EMAIL`   | email                            | always   |
| `ENABLE_METRICS`  | `true` \| `false`                | always   |

### Provider env requirements

- Clerk env vars are required only when `AUTH_MODE=clerk`.
- Stripe env vars are required only when `BILLING_MODE=managed`.
- PostHog env vars are required only when `ANALYTICS_MODE=posthog`.
- Resend env vars are required only when `EMAIL_MODE=resend`.
- SMTP env vars are required only when `EMAIL_MODE=smtp`.

### Runtime initialization and validation

- `backend/src/services/runtime.ts` lazily initializes Stripe, email, analytics, and provider-specific services.
- Unsupported mode combinations fail fast with clear startup errors.
- Acceptance: self-hosted boots with no Clerk, Stripe, Resend, or PostHog secrets.

## Runtime Behavior Matrix

| Surface                        | `managed + clerk + managed billing`        | `self-hosted + local + billing disabled` |
| ------------------------------ | ------------------------------------------ | ---------------------------------------- |
| Frontend provider mounting     | `ClerkProvider` + `ClerkTokenSync` mounted | neither mounted                          |
| Auth UI                        | Clerk UI enabled                           | local login/register/reset forms enabled |
| Auth routes                    | Clerk-only integration routes mounted      | Clerk routes unmounted                   |
| Local auth routes              | not primary path                           | mounted (`/api/auth/*` local endpoints)  |
| Session transport              | Clerk bridge                               | `mt_session` secure cookie + DB sessions |
| Billing API routes             | mounted                                    | unmounted (`404`)                        |
| Billing tab in settings        | visible                                    | hidden                                   |
| Password change page           | Clerk mutation flow                        | local `/api/auth/change-password`        |
| Analytics default              | optional PostHog                           | disabled by default                      |
| Hosted legal/branding defaults | allowed                                    | replaced by self-host config defaults    |

## Phase 0: Publishability Audit

### Actions

- Delete internal-only materials:
  - `docs/launch/*`
  - `docs/analysis/*`
  - `.github/IMPROVEMENTS_REQUIRED.md`
  - `.github/dev-commands.md`
  - `.kilocode/skills/macrotrackr-design/SKILL.md`
  - `backend/src/db/schema.ts.bak`
  - `test-results/.last-run.json`
  - tracked local DB artifacts (including history cleanup before publication if needed)
- Sanitize:
  - `backend/docs/WEBHOOK_SETUP.md`
  - `.github/README_DEPLOY.md`
  - deploy workflows
  - sample env docs
  - any hardcoded support or hosted-domain references
- Keep public:
  - dependency governance docs
  - frontend structure docs
  - sanitized self-host deployment docs
  - security/contribution/community docs

### Acceptance

- Repo contains no tracked secrets, artifacts, or internal launch material.
- Secret scanning passes.
- Artifact scan and internal-doc inventory pass.

## Phase 1: Runtime Modes and Config

### Actions

- Implement the canonical env contract in backend and frontend config.
- Enforce conditional provider env validation only for active modes.
- Implement lazy provider initialization in `backend/src/services/runtime.ts`.
- Add explicit startup validation for supported profile combinations.

### Acceptance

- Self-hosted profile boots with SQLite and local env examples only.
- No hard requirement for Clerk/Stripe/Resend/PostHog secrets when modes are disabled.

## Phase 2A: Backend Local Auth

### Data model

- Add `sessions` table:
  - `id`, `user_id`, `secret_hash`, `created_at`, `expires_at`, `last_used_at`, optional `ip`, `user_agent`.
- Preferred: add `password_reset_tokens` table:
  - `id`, `user_id`, `token_hash`, `created_at`, `expires_at`, `used_at`.
- If legacy inline reset fields are retained temporarily, document them as compatibility-only and add explicit removal follow-up.

### Session and cookie model

- Cookie: `mt_session`, `HttpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`.
- Session lifetime: 30-day sliding expiry.
- Rotate session on:
  - login
  - password change
  - password reset
- Support:
  - logout current session
  - logout all sessions

### Local routes (mounted only when `AUTH_MODE=local`)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`

### Mode isolation and constraints

- Clerk-only routes mount only in managed mode.
- Self-hosted auth uses Bun password hashing + DB sessions only.
- No Lucia.
- No JWT-based self-hosted auth.

### Legacy compatibility (`users.password`)

- Document exact handling for existing rows.
- Treat placeholder values (for example `"clerk-auth"`) as no local credential.
- Require password reset/bootstrap password before local login for those users.

### Acceptance

- Register/login/logout/session/logout-all/forgot/reset/change-password tests pass.
- Session rotation and sliding expiry behavior are verified.
- Local auth works with Clerk disabled.

## Phase 2B: Frontend Auth Mode Switching

### Actions

- `frontend/src/main.tsx` mounts `ClerkProvider` and `ClerkTokenSync` only in `AUTH_MODE=clerk`.
- Local mode uses native app auth hooks and the local session endpoint.
- Login/register/reset-password pages become mode-aware:
  - Clerk UI remains managed-only
  - local forms are enabled for self-hosted

### Acceptance

- Frontend auth smoke tests pass in both modes.
- Provider mounting and route/page visibility match mode matrix.

## Phase 2C: Auth Middleware Parity

### Actions

- Refactor current `clerk-auth` middleware into a provider adapter.
- Adapter resolves one normalized authenticated user shape from Clerk or local session.
- Downstream protected routes consume only normalized auth context (provider-agnostic contract).

### Acceptance

- Protected-route tests pass in both modes with identical route contracts.

## Phase 3: Branding, Legal, and Interface Abstraction

### Actions

- Replace hardcoded hosted values in runtime code:
  - `macrotrackr.com`
  - support emails
  - password-reset URLs
  - legal links
  - sender addresses
  - canonical URLs
  - blog CTA links
- Add one canonical branding contract:
  - app name source of truth: `PUBLIC_APP_NAME`
  - app URL source of truth: `APP_URL`
  - support email source of truth: `SUPPORT_EMAIL`
  - legal links source of truth: config-backed public settings
  - brand assets source of truth: configurable frontend branding settings
- Keep hosted-service privacy/terms separate from OSS/community docs.

### Acceptance

- Grep audit finds no hardcoded hosted production domain in runtime code except approved defaults/examples.
- Billing-hidden UI and disabled-billing route behavior match the runtime matrix.

## Phase 4: Self-Hosting and OSS Scaffolding

### Actions

- Add OSS/community/legal files:
  - `LICENSE`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `SUPPORT.md`
  - trademark policy
- Add self-host artifacts:
  - backend/frontend `Dockerfile`s
  - `docker-compose.yml`
  - `.dockerignore`
  - managed and self-host `.env.example` files
- Ship one supported deployment story with:
  - one-command local start
  - one-command production-ish compose start
  - persistent SQLite volume path
  - reverse-proxy/TLS expectation
  - backup, restore, and upgrade commands
  - first-run bootstrap for initial admin/user creation

### Acceptance

- Fresh clone self-host install works without manual code changes.

## Public Interfaces

- Normalize auth and user interfaces so provider-specific fields are not part of the core contract.
- `GET /api/user/me` returns generic user identity and plan/subscription state.
- In self-hosted mode, do not expose Stripe-specific transport details.
- `BILLING_MODE=disabled` behavior is unmount-and-`404`, documented as canonical.
- Document exact compatibility handling for legacy `users.password` rows, including placeholder values like `"clerk-auth"`.

## Test Plan

- Phase 0: secret scan, artifact scan, domain/branding scan, internal-docs inventory.
- Phase 1: self-hosted boot test with only SQLite and local env examples.
- Phase 2A: register/login/logout/session rotation/logout-all/password reset/change-password tests.
- Phase 2B: frontend auth smoke tests in both modes, including provider mounting and route visibility.
- Phase 2C: middleware parity tests proving identical protected-route behavior in Clerk and local modes.
- Phase 3: branding grep tests, billing-hidden UI tests, disabled-billing route tests.
- Phase 4: Docker Compose install, persistent volume restart, backup/restore, first-run bootstrap tests.

### Release gate

- Backend test suite green.
- Frontend typecheck green.
- Frontend lint warnings reduced to an agreed threshold.
- Current failing frontend Vitest groups fixed by category:
  - unresolved imports
  - missing provider wrappers
  - missing browser mocks such as `matchMedia`
  - stale expectations
  - component prop/contract drift

## Assumptions

- SQLite remains the only supported database for this migration.
- Postgres is explicitly deferred and removed as an active planning branch.
- Self-hosted mode is local-auth only in v1; OIDC/SAML are out of scope.
- Billing is intentionally disabled for self-hosters as part of the COSS strategy.
- OSS repo publication happens only after the release gate passes, not incrementally during the refactor.
