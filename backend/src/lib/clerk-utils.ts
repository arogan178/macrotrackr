// src/lib/clerk-utils.ts
import type { Database } from "bun:sqlite";
import { safeQuery } from "./database";
import { logger } from "./logger";

/**
 * Get internal user ID from Clerk ID
 * This is a shared utility for all route modules
 */
export function getInternalUserId(
  db: Database,
  clerkUserId: string | null,
  _email?: string | null
): number | null {
  if (!clerkUserId) {
    logger.debug("[getInternalUserId] No clerkUserId provided");
    return null;
  }

  logger.debug({ clerkUserId }, "[getInternalUserId] Looking up user");

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

  logger.warn({ clerkUserId }, "[getInternalUserId] User not found by Clerk ID");
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
