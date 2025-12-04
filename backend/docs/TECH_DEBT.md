# Backend Technical Debt

This document tracks known structural issues and improvements to be addressed in future cleanup efforts.

---

## Priority: High

### 1. Remaining `console.log`/`console.error` Usage ✅ RESOLVED

~~The codebase has a proper logger (`lib/logger.ts` using pino), but some files still use `console.*`~~

**Fixed**:

- ✅ `src/modules/macros/routes.ts` - Replaced with `loggerHelpers.error()`
- ✅ `src/lib/email-service.ts` - Refactored to use structured `logger`

**Acceptable exceptions** (logger not initialized at load time):

- `src/config.ts` - startup logging
- `src/db/index.ts` - database initialization

### 2. Webhook Handler in `index.ts` ✅ RESOLVED

~~The Stripe webhook handler (~150 lines) is defined directly in `src/index.ts`~~

**Fixed**: Extracted to `src/modules/billing/webhook-handler.ts`:

- Webhook handler is now a separate Elysia instance
- Uses static imports for `StripeService` and `SubscriptionService`
- Imported and mounted in `index.ts` before auth middleware

### 3. Inline Dynamic Imports in Webhook Handler ✅ RESOLVED

~~The webhook handler uses inline `await import()` to avoid circular dependencies~~

**Fixed**: Now uses static imports in `modules/billing/webhook-handler.ts`.

---

## Priority: Medium

### 4. Duplicated Cookie Logic in Auth Routes ✅ RESOLVED

~~The cookie attribute calculation is duplicated in both `/register` and `/login` endpoints~~

**Fixed**: Extracted to `lib/auth-utils.ts` with `createJwtCookie()` helper.

### 5. Manual `require()` in Auth Routes ✅ RESOLVED

~~The `/forgot-password` endpoint uses CommonJS `require()` for dynamic imports~~

**Fixed**:

- Removed file-based logging (`logToFile`)
- Converted to proper ESM imports
- Now uses `loggerHelpers.auth()` for structured logging

### 6. Inconsistent Transaction Patterns ✅ RESOLVED

~~Some routes use `withTransaction()` from `lib/database.ts`, others use `db.transaction()` directly~~

**Fixed**: All routes now use `withTransaction()` consistently:

- ✅ `goals/routes.ts` - Updated all 5 transaction usages
- ✅ `user/routes.ts` - Already using `withTransaction()`
- ✅ `auth/routes.ts` - Already using `withTransaction()`

### 7. Type Definitions Scattered Across Route Files ✅ RESOLVED

~~Each route file defines its own DB result types~~

**Fixed**: All DB row types consolidated in `lib/database.ts`:

- ✅ `UserRow`, `UserDetailsRow`
- ✅ `MacroEntryRow`, `MacroTargetRow`
- ✅ `WeightGoalRow`, `WeightLogRow`
- ✅ `HabitRow`, `SubscriptionRow`

Route files now import types from `lib/database.ts`.

### 8. Reporting Module Accessing `ctx.store` Directly ✅ RESOLVED

~~`src/modules/reporting/routes.ts` accesses userId via `ctx.store`~~

**Fixed**: Updated to use proper auth middleware pattern with `ctx.user.userId`.

---

## Priority: Low

### 9. Hardcoded Plan Information ✅ RESOLVED

~~`billing/routes.ts` has hardcoded plan features in `/plans` endpoint~~

**Fixed**: Created `src/config/pricing.ts` with centralized plan configuration:

- `PRICING` object with monthly/yearly prices (aligned with frontend)
- `FREE_FEATURES` and `PRO_FEATURES` arrays
- `Plan` interface and `PLANS` constant
- `/plans` endpoint now uses `getPlans()` from config

### 10. Missing Response Schemas ✅ RESOLVED

~~Some billing endpoints don't have explicit response schemas~~

**Fixed**: Added Elysia `t.Object()` schemas to all billing and reporting endpoints:

- ✅ `GET /api/billing/details` - `BillingDetailsResponseSchema`
- ✅ `POST /api/billing/cancel` - `CancelResponseSchema`
- ✅ `POST /api/billing/checkout` - `CheckoutResponseSchema`
- ✅ `POST /api/billing/portal` - `PortalResponseSchema`
- ✅ `GET /api/billing/subscription` - `SubscriptionStatusResponseSchema`
- ✅ `GET /api/billing/plans` - `PlansResponseSchema`
- ✅ `GET /api/reporting/nutrient-density-summary` - `NutrientDensitySummaryResponseSchema`

### 11. Index File Complexity ✅ RESOLVED

~~`src/index.ts` handles multiple concerns~~

**Fixed**: Extracted all major concerns to dedicated modules:

- ✅ `middleware/request-limits.ts` - Request body size validation
- ✅ `routes/health.ts` - Health check endpoints (`/`, `/health`, `/health/ready`)
- ✅ `modules/billing/webhook-handler.ts` - Stripe webhook handling

`index.ts` now focuses on:

- App initialization and plugin registration
- Middleware chain orchestration
- Error handling
- Server startup

**Result**: Reduced from ~300 lines to ~180 lines.

### 12. Cache Service Type Safety ✅ ALREADY DONE

~~`lib/cache-service.ts` stores and returns `any`~~

**Status**: Already has proper generics:

```typescript
get<T>(key: string): T | null { ... }
set<T>(key: string, data: T) { ... }
```

---

## Completed ✓

### Structured Logging

- ✅ Implemented pino logger with environment-specific config
- ✅ Created `loggerHelpers` for common patterns (apiRequest, dbQuery, auth, security)
- ✅ Added data sanitization for sensitive fields

### Database Safety

- ✅ `safeQuery`, `safeQueryAll`, `safeExecute` wrappers in `lib/database.ts`
- ✅ `withTransaction` helper for atomic operations
- ✅ Typed row interfaces for common tables

### Error Handling

- ✅ Typed error classes in `lib/errors.ts` (AppError, NotFoundError, ValidationError, etc.)
- ✅ Global error handler in `index.ts`
- ✅ `handleError` utility in `lib/responses.ts`

### Schema Migrations

- ✅ Idempotent column additions via `checkAndAddColumn()`
- ✅ Index creation for performance optimization
- ✅ Habits table migration (removed CHECK constraint)

### Response Formatting

- ✅ `toCamelCase()` utility for snake_case → camelCase conversion
- ✅ Consistent JSON responses

---

## Testing (Placeholder)

Tests are not yet implemented for the backend. When added:

- Use Bun's built-in test runner (`bun test`)
- Add integration tests for critical paths (auth, billing webhooks)
- Add unit tests for service functions
- Mock database for isolated testing

---

## Enforcement Suggestions

1. Add ESLint rule to warn on `console.*` usage (except in config/db init)
2. Add pre-commit hook to check for `require()` usage in `.ts` files
3. Consider TypeScript strict mode for better type safety
4. Add response schema validation in CI

---

_Last updated: December 2025_
