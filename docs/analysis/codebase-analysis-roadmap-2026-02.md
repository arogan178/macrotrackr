# Macro Tracker Full Codebase Analysis & Improvement Roadmaps (2026-02)

> Comprehensive engineering analysis of the current monorepo (backend + frontend + delivery pipeline), with prioritized roadmaps for reliability, scalability, security, maintainability, and delivery quality.

---

## Executive summary

Macro Tracker has a **strong foundation**:

- Modern stack (Bun, Elysia, React 19, TanStack Query/Router, Clerk, Stripe)
- Solid separation of frontend feature modules
- Useful backend abstractions (`safeQuery`, `withTransaction`, structured logging)
- Production deployment workflow in place

However, there are several high-impact issues limiting long-term quality:

1. **Auth migration is incomplete and inconsistent** (legacy JWT middleware still active in places)
2. **Automated testing is effectively absent** (`vitest` finds no tests)
3. **Route/module typing is heavily `any`-based**, reducing strict-mode value
4. **Backend/Frontend contract boundaries are partially mixed** (deprecated auth paths still in live client service layer)
5. **Operational quality gates are shallow** (deploy pipeline lacks hard quality gates before deployment)

If addressed in sequence, this codebase can move from “works today” to “robust at scale.”

---

## Analysis baseline performed

The following baseline checks were run during this analysis:

- `bun run typecheck` [PASS] (backend + frontend passed)
- `bun run lint` [PASS] (frontend lint passed)
- `bun run test` [FAIL] (fails because no test files found)

Implication: static analysis is present, but test safety net is missing.

---

## Key strengths to preserve

### Architecture

- Feature-based frontend structure (`src/features/*`) is maintainable.
- Query key factory and query config centralization are strong patterns.
- Backend modularization by domain (`auth`, `macros`, `goals`, `billing`, `reporting`) is clear.

### Runtime behavior

- Good caching/retry defaults in `frontend/src/lib/queryClient.ts`.
- Correlation/request tracing middleware is present backend-side.
- Health endpoints and PM2 process definitions exist.

### Product/platform integration

- Clerk + Stripe integration has dedicated modules and webhook handling.
- PWA + service worker support exists and is integrated into build.

---

## Critical findings (priority order)

## P0 — Must fix first

### 1) Auth middleware inconsistency (legacy JWT vs Clerk)

**Evidence**

- Global backend auth uses `clerkAuthMiddleware` in `backend/src/index.ts`.
- `backend/src/modules/reporting/routes.ts` still imports and uses legacy `authMiddleware`.
- `backend/src/middleware/pro-guard.ts` and `featureLimitGuard` also use legacy `authMiddleware`.

**Risk**

- Route behavior may differ by endpoint.
- Clerk tokens may fail in middleware expecting legacy JWT.
- High chance of hidden auth bugs in protected feature paths.

**Action**

- Consolidate on Clerk-only middleware.
- Replace legacy `authMiddleware` dependencies with Clerk-compatible guards.
- Remove legacy middleware after migration tests pass.

---

### 2) No automated tests

**Evidence**

- `file_search` shows no `*.test.*` or `*.spec.*` files.
- `bun run test` exits with “No test files found.”

**Risk**

- Refactor risk is high.
- Regression detection is manual and unreliable.
- Deploy confidence is lower than it appears.

**Action**

- Establish minimum test baseline (contract + integration + a few E2E).
- Add CI quality gate requiring tests before deploy.

---

### 3) Type-safety erosion from pervasive `any`

**Evidence**

- Extensive `context: any` in backend route handlers.
- Significant `as any` usage across frontend hooks/charts/auth flows.

**Risk**

- Strict TypeScript posture is diluted.
- Runtime errors may bypass compile-time guarantees.

**Action**

- Introduce typed route-context helpers for Elysia handlers.
- Replace critical `any` zones first: auth flows, macro query mutations, billing webhooks.

---

## P1 — High impact next

### 4) Contract drift and deprecated endpoint coupling

**Evidence**

- Frontend `apiServices.ts` still includes deprecated legacy auth methods while app is Clerk-first.
- Backend retains deprecated endpoints and dual patterns.

**Risk**

- Drift in expected response shapes.
- Confusion for developers and future refactors.

**Action**

- Separate legacy compatibility layer from primary service API.
- Document and schedule deprecation/removal milestones.

---

### 5) Frontend optimistic cache logic complexity

**Evidence**

- `useMacroQueries.ts` has dense optimistic logic with inconsistent totals field names (`calories` vs `totalCalories`, `fats` vs `fat`).

**Risk**

- Potential silent state bugs.
- Hard-to-maintain mutation behavior.

**Action**

- Normalize cache shape and totals field names.
- Extract optimistic update utilities with typed contracts and unit tests.

---

### 6) Operational pipeline gaps

**Evidence**

- Deploy workflow performs backend/frontend deployment via SSH/PM2.
- No explicit pre-deploy test gate beyond install/build steps.
- Deploy branch still targets `master` only.

**Risk**

- Broken behavior can reach production if static checks pass.

**Action**

- Add quality-gate job (`typecheck`, `lint`, `tests`) as deployment prerequisite.
- Add smoke checks post-deploy for key API routes and app shell.

---

## P2 — Medium-term modernization

### 7) Database migration strategy

**Evidence**

- Schema evolution is mostly runtime `ALTER TABLE` checks in `schema.ts`.

**Risk**

- Production schema changes become harder to reason about/audit over time.

**Action**

- Introduce versioned migration files and migration table.
- Keep runtime guard rails for safety, but move canonical changes into explicit migrations.

---

### 8) Logging strategy consistency (frontend + backend)

**Evidence**

- Backend uses structured logger.
- Frontend has many raw `console.*` statements in production code paths.

**Risk**

- Inconsistent observability and noisy production logs.

**Action**

- Introduce client logger abstraction with environment-aware behavior.
- Route serious errors through analytics/monitoring hooks.

---

## Multi-track roadmaps

## Roadmap A — Authentication and authorization consolidation [COMPLETE]

> **Status**: Completed 2026-02-17
> **Branch**: `feat/clerk-auth-cleanup`
> **Merged to**: `develop`

### Goal

Single, predictable auth model (Clerk-first) across all routes and guards.

### Scope

- ~~`backend/src/middleware/auth.ts`~~ — DELETED
- `backend/src/middleware/clerkAuth.ts` — Active (global middleware)
- `backend/src/middleware/clerk-guards.ts` — NEW (requireAuth, requirePro, checkFeatureLimit)
- ~~`backend/src/middleware/pro-guard.ts`~~ — DELETED
- All route modules — Updated to use ClerkAuthContext

### Milestones

1. [DONE] Build Clerk-compatible guard helpers (`requireAuth`, `requirePro`, `checkFeatureLimit`).
2. [DONE] Replace legacy middleware usages in reporting and pro guard paths.
3. [DEFERRED] Add route-level integration tests for auth-required endpoints. (Deferred to Roadmap B)
4. [DONE] Remove legacy JWT middleware from active codepaths.

### Success criteria

- [DONE] No route imports `middleware/auth.ts` in runtime auth flow.
- [DONE] All protected endpoints authenticate Clerk tokens consistently.

---

## Roadmap B — Testing foundation and quality gates [COMPLETE]

> **Status**: Completed 2026-02-18
> **Branch**: `feat/roadmap-b-testing-foundation`
> **Commit**: `658d429`

### Goal

Establish regression protection and release confidence.

### Scope

- Backend: integration tests for core routes/services
- CI: gate merges/deploys on test success

### Milestones

1. [DONE] Add first 10 high-value tests (165 tests passing):
   - Macro schema validation tests
   - Goals schema validation tests
   - User schema validation tests
   - Auth middleware tests
   - API contract tests for core response schemas
2. [DONE] Add API contract tests for core response schemas.
3. [DONE] Add CI workflow for `typecheck + lint + test`.
4. [DONE] Block deploy job when quality gates fail.

### Deliverables

- **Test Files**: 5 files (`backend/tests/`)
  - `auth/clerkAuth.test.ts` — Auth middleware tests
  - `contracts/api-responses.test.ts` — API contract tests
  - `contracts/schemas.ts` — Shared schema fixtures
  - `goals/schemas.test.ts` — Goals schema validation
  - `macros/schemas.test.ts` — Macros schema validation
  - `user/schemas.test.ts` — User schema validation
- **Test Infrastructure**: `backend/vitest.config.ts`, test scripts in `package.json`
- **CI Workflow**: `.github/workflows/quality-gate.yml`
- **Deploy Dependency**: `needs: quality` in `.github/workflows/deploy.yml`

### Success criteria

- [DONE] `bun run test` passes with meaningful suite (165 tests).
- [DONE] Deploy workflow depends on passing tests.

---

## Roadmap C — Type-safety recovery [COMPLETE]

> **Status**: Completed 2026-02-18
> **Branch**: `feat/roadmap-c-type-safety`

### Goal

Reduce runtime uncertainty by removing strategic `any` usage.

### Scope

- Backend route contexts
- Frontend query/mutation cache transforms
- Billing webhook/service typing

### Milestones

1. [DONE] Create typed handler context aliases per module (`backend/src/types/context.ts`).
2. [DONE] Replace `context: any` in top-traffic backend routes (39 occurrences in 6 files).
3. [DONE] Replace `as any` in frontend (15 files, 137 insertions, 87 deletions).
4. [DONE] Add lint rule and PR check to prevent new `any` proliferation in critical paths (backend + frontend ESLint configs).

### Success criteria

- [DONE] `any` usage reduced significantly in runtime paths.
- [DONE] Fewer type assertions in auth/query/billing layers.

---

## Roadmap D — Data correctness and API contract integrity [COMPLETE]

> **Status**: Completed 2026-02-20
> **Branch**: `feat/roadmap-d-data-correctness`

### Goal

Canonical, consistent domain models across backend and frontend.

### Scope

- Macro totals fields
- Weight log/date semantics
- Deprecated endpoint separation
- Shared contract generation or strict schema mapping

### Milestones

1. [DONE] Normalize macro totals naming and response shapes (fixed `totalProtein` → `protein`, etc.).
2. [DONE] Add central mappers between DB snake_case and API camelCase (`backend/src/lib/mappers/index.ts`).
3. [DONE] Split legacy endpoints into compatibility namespace (deprecated 6 auth endpoints with headers).
4. [DONE] Add contract fixtures and schema snapshots (38 tests, 25 snapshots).

### Deliverables

- **Mappers**: `backend/src/lib/mappers/index.ts` — Central snake_case ↔ camelCase transformations
- **Deprecated Endpoints**: 6 legacy auth endpoints marked with `Deprecation` headers
- **Contract Tests**:
  - `backend/tests/contracts/api-responses.test.ts` — API contract tests
  - `backend/tests/contracts/response-snapshots.test.ts` — Response snapshot tests
  - `backend/tests/contracts/schemas.ts` — Shared schema fixtures
  - `backend/tests/contracts/__snapshots__/` — 25 response snapshots
  - `backend/tests/fixtures/macro-responses.ts` — Macro response fixtures

### Success criteria

- [DONE] No duplicated/ambiguous totals fields.
- [DONE] Frontend consumes stable response contracts.

---

## Roadmap E — Operational excellence and deploy hardening

### Goal

Safer deploys, better incident response, stronger observability.

### Scope

- `.github/workflows/deploy.yml`
- PM2 health checks and post-deploy smoke tests
- Structured logs + dashboards + alerts

### Milestones

1. Add mandatory pre-deploy quality gate job.
2. Add post-deploy smoke test step (health + key API routes).
3. Define SLO metrics (error rate, latency, auth failures, webhook failures).
4. Alerting setup for high-severity failures.

### Success criteria

- Deploys fail fast on quality regressions.
- Critical failures detected quickly with actionable telemetry.

---

## Roadmap F — Performance and scalability track

### Goal

Sustain responsiveness as data and usage scale.

### Scope

- Frontend list rendering and cache updates
- Backend query performance
- Bundle/watchdog controls

### Milestones

1. Introduce list virtualization threshold for large history views.
2. Add query-level performance traces for slow backend endpoints.
3. Reduce re-render hotspots in macro/history flows.
4. Add bundle size guardrails and trend checks in CI.

### Success criteria

- Large history pages remain smooth.
- Slow queries are measurable and reduced.

---

## 30/60/90 execution plan

## First 30 days

- Complete auth consolidation plan design and start migration
- Add first meaningful test suite + CI quality gate
- Fix macro totals contract inconsistencies
- Add post-deploy smoke checks

## Days 31–60

- Remove legacy JWT runtime dependencies
- Expand backend integration coverage and webhook tests
- Reduce critical `any` usage in backend routes + macro hooks
- Introduce migration framework draft

## Days 61–90

- Formalize migration/versioning process
- Add performance dashboards + alerting
- Implement virtualization where needed
- Stabilize contract tests and deprecate legacy endpoints

---

## Suggested ownership model

- **Platform/Infra**: CI gates, deploy hardening, monitoring
- **Backend**: auth consolidation, migration framework, contract integrity
- **Frontend**: query/mutation typing, cache consistency, rendering performance
- **QA/Quality**: test suite growth, smoke/regression plans

---

## KPI baseline and targets

### Current baseline

- Typecheck: passing
- Lint: passing
- Tests: failing (none present)

### 90-day targets

- Test coverage baseline established (critical flows)
- Zero legacy JWT auth in runtime path
- Reduced runtime `any` in high-risk modules
- Deploy pipeline with enforced quality gates and smoke checks

---

## Immediate actionable backlog (next 2 sprints)

1. ~~Replace legacy auth middleware usage in reporting/pro-guard paths.~~ [DONE]
2. Stand up initial test suite (frontend + backend integration).
3. Add CI quality-gate workflow and make deploy depend on it.
4. Refactor `useMacroQueries` totals field consistency + add tests.
5. Introduce typed route context helper patterns for backend modules.

---

## Final assessment

Macro Tracker is **well-positioned**: architecture choices are good, and the app appears actively maintained. The fastest path to “enterprise-grade reliability” is not a redesign—it is:

- auth model consolidation,
- test-first quality gates,
- type-safety tightening,
- and operational guardrails.

Once these are in place, feature velocity can increase with significantly lower regression risk.
