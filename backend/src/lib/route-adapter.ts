// src/lib/route-adapter.ts
import type { ClerkAuthContext } from "../middleware/clerkAuth";
import type { Database } from "bun:sqlite";
import { getInternalUserId } from "./clerk-utils";
import { NotFoundError } from "./errors";

/**
 * Adapts Clerk auth context to legacy format expected by existing routes
 * This provides backward compatibility during migration
 */
export function adaptClerkToLegacy(
  context: ClerkAuthContext & { db?: Database }
): { userId: number; email?: string; firstName?: string; lastName?: string } {
  const { user, internalUserId, db } = context;

  if (!user?.clerkUserId) {
    throw new Error("Unauthorized");
  }

  // Use pre-resolved internal user ID or look it up
  const resolvedUserId =
    internalUserId ??
    (db ? getInternalUserId(db, user.clerkUserId, user.email) : null);

  if (!resolvedUserId) {
    throw new NotFoundError(
      "User not found. Please sign out and sign in again."
    );
  }

  return {
    userId: resolvedUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Type guard to check if context has Clerk auth
 */
export function hasClerkAuth(context: any): context is ClerkAuthContext {
  return context?.user?.clerkUserId !== undefined;
}

/**
 * Get user ID from context (handles both legacy and Clerk auth)
 */
export function getUserId(context: any): number {
  if (hasClerkAuth(context)) {
    const legacy = adaptClerkToLegacy(context);
    return legacy.userId;
  }
  // Legacy format
  return context?.user?.userId;
}
