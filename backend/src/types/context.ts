// src/types/context.ts
/**
 * Typed context aliases for route handlers
 * These types replace `context: any` with properly typed context objects
 */

/**
 * Authenticated user object from Clerk + internal database
 */
export interface AuthenticatedUser {
  /** Internal database user ID */
  userId?: number | null;
  /** Clerk user ID */
  id: string;
  /** Clerk user ID (alias for id) */
  clerkUserId: string;
  /** User email address */
  email?: string;
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** User's avatar image URL */
  imageUrl?: string;
}

/**
 * Base authenticated context from Elysia + clerkAuth middleware
 * This is the minimum context available to all authenticated routes
 */
export interface AuthenticatedContext {
  /** Authenticated user object */
  user: AuthenticatedUser;
  /** Clerk user ID (shortcut) */
  clerkUserId: string | null;
  /** Internal database user ID (shortcut) */
  internalUserId: number | null;
  /** Request correlation ID for distributed tracing */
  correlationId: string;
  /** Original request object */
  request: Request;
  /** Response setter */
  set: {
    status?: number;
    headers?: Record<string, string>;
  };
}

/**
 * Module-specific context aliases
 * These provide semantic naming for each module's route handlers
 */

/** Context for macro tracking routes */
export type MacrosContext = AuthenticatedContext;

/** Context for goals routes */
export type GoalsContext = AuthenticatedContext;

/** Context for user routes */
export type UserContext = AuthenticatedContext;

/** Context for auth routes */
export type AuthContext = AuthenticatedContext;

/** Context for habits routes */
export type HabitsContext = AuthenticatedContext;

/** Context for billing routes */
export type BillingContext = AuthenticatedContext;

/**
 * Extended context with database access
 * Use this when route handlers need direct database access
 */
export interface AuthenticatedContextWithDb extends AuthenticatedContext {
  /** Database instance */
  db: import("bun:sqlite").Database;
}

/**
 * Extended context with body/params/query
 * Use this for routes that handle request data
 */
export interface RouteContext<TBody = unknown, TParams = unknown, TQuery = unknown>
  extends AuthenticatedContext {
  /** Request body */
  body?: TBody;
  /** Route parameters */
  params?: TParams;
  /** Query string parameters */
  query: TQuery;
}
