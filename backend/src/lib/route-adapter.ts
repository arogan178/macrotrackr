// src/lib/route-adapter.ts
import type { Database } from "bun:sqlite";

import type { ClerkAuthContext } from "../middleware/clerkAuth";
import { getInternalUserId } from "./clerk-utils";
import { NotFoundError } from "./errors";

/**
 * Resolve the internal application user identity from Clerk auth context.
 */
export function resolveAuthenticatedUser(
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
