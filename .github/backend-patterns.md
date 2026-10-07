# Backend Patterns

Patterns and conventions for the Elysia.js backend.

## Route Module Pattern

Routes are defined in `backend/src/modules/*/routes.ts` as Elysia plugin instances with their routes chained, so route types reach the app's `App` type:

```typescript
// Route module pattern
export const macroRoutes = new Elysia({ prefix: "/api/macros" })
  .get("/search", searchHandler, { query: SearchSchema })
  .post("/entry", createHandler, { body: CreateSchema })
  .put("/entry/:id", updateHandler, { body: UpdateSchema })
  .delete("/entry/:id", deleteHandler);
```

### Route Organization

- Each feature module has its own `routes.ts` file
- Routes are mounted in one chain in [`backend/src/app.ts`](../backend/src/app.ts), which exports `type App`. Mount a mode-dependent plugin with `.use(enabled ? plugin : undefined)`; never mutate the app outside the chain, or its routes drop out of `App`
- [`backend/tests/app-types.test-d.ts`](../backend/tests/app-types.test-d.ts) fails the typecheck if response types stop reaching `App`
- Schemas are co-located in `schemas.ts` within the same module

## Error Handling

Use custom error classes from [`backend/src/lib/errors.ts`](../backend/src/lib/errors.ts). Never throw raw `Error`:

```typescript
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
} from "../../lib/errors";

// Common error patterns
throw new NotFoundError("Macro entry not found");
throw new ValidationError("Invalid input", { field: "protein" });
throw new AuthorizationError("Not authorized to access this resource");
throw new ConflictError("Resource already exists");
throw new RateLimitError("Too many requests");
```

### Error Class Hierarchy

- `AppError` - Base class for all custom errors
- `NotFoundError` (404) - Resource not found
- `ValidationError` (400) - Invalid input data
- `AuthorizationError` (401/403) - Auth failures
- `ConflictError` (409) - Duplicate resources
- `RateLimitError` (429) - Rate limiting

## Structured Logging

Use `loggerHelpers` from [`backend/src/lib/logger.ts`](../backend/src/lib/logger.ts):

```typescript
import { loggerHelpers } from "../../lib/logger";

// API request logging
loggerHelpers.apiRequest("GET", "/api/macros", userId);

// Database operation logging
loggerHelpers.dbQuery("SELECT", "macro_targets", userId, rowCount);

// Error logging with context
loggerHelpers.error(error, { operation: "parse_locked_macros" }, userId);

// Performance timing
loggerHelpers.performance("macro_calculation", duration, userId);
```

### Log Levels

- `info` - Normal operations
- `warn` - Recoverable issues
- `error` - Errors requiring attention
- `debug` - Development details

## Authentication

Clerk middleware with exempt paths defined in [`backend/src/middleware/clerkAuth.ts`](../backend/src/middleware/clerkAuth.ts):

```typescript
// Protected routes receive user object in context
app.get("/api/protected", async (c) => {
  const userId = c.user.id; // Available after auth middleware
  // ...
});

// Exempt paths (no auth required)
const AUTH_EXEMPT_PATHS = [
  "/health",
  "/health/ready",
  "/api/webhooks/clerk",
  // ...
];
```

### Auth Utilities

```typescript
import { getAuthUserId } from "../../lib/auth-utils";

// Extract user ID from context
const userId = getAuthUserId(c);
```

## Schema Validation

Zod schemas for request validation in `schemas.ts` files:

```typescript
import { t } from "elysia";
import { z } from "zod";

// Using Elysia's type system
const CreateMacroSchema = t.Object({
  food_name: t.String(),
  calories: t.Number(),
  protein: t.Number(),
  carbs: t.Number(),
  fat: t.Number(),
  date: t.String(),
});

// Using Zod (alternative)
const createMacroSchema = z.object({
  food_name: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

## Database Patterns

SQLite with `bun:sqlite` driver:

```typescript
import { db } from "../../db";

// Query with parameters
const entries = db
  .query("SELECT * FROM macro_entries WHERE user_id = ?")
  .all(userId);

// Insert with returning
const result = db
  .query(
    "INSERT INTO macro_entries (user_id, food_name) VALUES (?, ?) RETURNING *",
  )
  .get(userId, foodName);

// Transaction
db.transaction(() => {
  // Multiple operations
})();
```

### Database Schema

Built by numbered migrations in [`backend/src/db/migrations/`](../backend/src/db/migrations/). On startup, `initializeSchema` in [`backend/src/db/schema.ts`](../backend/src/db/schema.ts) runs each migration above `PRAGMA user_version` in its own transaction and sets `user_version` to its number.

To change the schema, add `NNNN_<name>.ts` exporting one function that takes the `Database`, and append it to the list in `migrations/index.ts`. Never edit, reorder or remove a migration that has shipped. Rebuild a table (create, copy, drop, rename) when SQLite cannot `ALTER` it; the runner turns foreign keys off around migrations so the drop does not cascade.

Main tables:

- `users` - User profiles and settings
- `macro_entries` - Food log entries
- `macro_targets` - Daily macro goals
- `habits` - Habit tracking
- `subscriptions` - Stripe billing

## Key Backend Files

| File                                                                              | Purpose                        |
| --------------------------------------------------------------------------------- | ------------------------------ |
| [`backend/src/index.ts`](../backend/src/index.ts)                                 | Server setup, middleware chain |
| [`backend/src/db/migrations/`](../backend/src/db/migrations/)                     | Database schema migrations     |
| [`backend/src/lib/errors.ts`](../backend/src/lib/errors.ts)                       | Custom error classes           |
| [`backend/src/lib/logger.ts`](../backend/src/lib/logger.ts)                       | Structured logging             |
| [`backend/src/lib/database.ts`](../backend/src/lib/database.ts)                   | Database utilities             |
| [`backend/src/middleware/clerkAuth.ts`](../backend/src/middleware/clerkAuth.ts)   | Auth middleware                |
| [`backend/src/modules/macros/routes.ts`](../backend/src/modules/macros/routes.ts) | Example route module           |
