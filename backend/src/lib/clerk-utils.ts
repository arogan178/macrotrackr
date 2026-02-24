// src/lib/clerk-utils.ts
import type { Database } from "bun:sqlite";
import { safeQuery } from "./database";
import { logger } from "./logger";

/**
 * Get internal user ID from Clerk ID or email
 * This is a shared utility for all route modules
 */
export function getInternalUserId(
  db: Database,
  clerkUserId: string | null,
  email?: string | null
): number | null {
  if (!clerkUserId) {
    logger.debug("[getInternalUserId] No clerkUserId provided");
    return null;
  }

  logger.debug({ clerkUserId, email }, "[getInternalUserId] Looking up user");

  // First try to find by Clerk ID
  const userByClerkId = safeQuery<{ id: number; email: string }>(
    db,
    "SELECT id, email FROM users WHERE clerk_id = ?",
    [clerkUserId]
  );

  if (userByClerkId) {
    logger.debug({ userId: userByClerkId.id, clerkUserId }, "[getInternalUserId] Found user by Clerk ID");
    return userByClerkId.id;
  }

  logger.debug({ clerkUserId }, "[getInternalUserId] User not found by Clerk ID, trying email");

  // Fall back to email lookup
  if (email) {
    const userByEmail = safeQuery<{ id: number; clerk_id: string | null }>(
      db,
      "SELECT id, clerk_id FROM users WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    if (userByEmail) {
      // Update the user with the Clerk ID for future lookups
      const { safeExecute } = require("./database");
      safeExecute(
        db,
        "UPDATE users SET clerk_id = ? WHERE id = ?",
        [clerkUserId, userByEmail.id]
      );
      logger.info(
        { userId: userByEmail.id, clerkUserId, previousClerkId: userByEmail.clerk_id },
        "[getInternalUserId] Linked existing user to new Clerk ID"
      );
      return userByEmail.id;
    }
  }

  logger.warn({ clerkUserId, email }, "[getInternalUserId] User not found by Clerk ID or email");
  return null;
}

/**
 * Type for Clerk authentication context
 */
export interface ClerkUserContext {
  user: {
    id: string;
    clerkUserId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  clerkUserId: string | null;
  clerkClient?: any;
}
