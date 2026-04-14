import type { Database } from "bun:sqlite";
import { Elysia } from "elysia";

import {
  type UserRow,
  safeExecute,
  safeQuery,
  withTransaction,
} from "../../lib/data/database";
import { AuthenticationError, ConflictError } from "../../lib/http/errors";
import { logger } from "../../lib/observability/logger";
import type { ClerkAuthContext } from "../../middleware/clerk-auth";

import type { RouteContext } from "../../types";
import { resolveClerkIdentity } from "../../lib/auth/route-adapter";



// import { rateLimiters } from "../../middleware/rate-limit"; // Temporarily disabled

interface ClerkUserRecord {
  emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
  primaryEmailAddressId?: string;
  firstName?: string;
  lastName?: string;
}

function getPrimaryClerkEmail(user: ClerkUserRecord | undefined): string | undefined {
  if (!user?.emailAddresses || user.emailAddresses.length === 0) {
    return undefined;
  }

  if (user.primaryEmailAddressId) {
    const primary = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    if (primary?.emailAddress) {
      return primary.emailAddress;
    }
  }

  return user.emailAddresses[0]?.emailAddress;
}

interface ClerkApiClient {
  users?: {
    getUser?: (userId: string) => Promise<ClerkUserRecord | undefined>;
  };
}

type AuthRouteContext<TBody = Record<string, unknown>> = RouteContext<
  TBody,
  Record<string, string>,
  Record<string, string | undefined>
> & {
  db: Database;
  clerkClient?: ClerkApiClient;
};



export const authRoutes = (app: Elysia) =>
  app.group("/api/auth", (group) =>
    group
      // .use(rateLimiters.auth) // Temporarily disabled for testing

      // Clerk User Sync - Sync Clerk user with our database
      .post(
        "/clerk-sync",
        async (context) => {
          const { db, clerkClient } = context as unknown as AuthRouteContext;
          const {
            clerkUserId,
            email: initialEmail,
            firstName: initialFirstName,
            lastName: initialLastName,
          } = resolveClerkIdentity(context as unknown as ClerkAuthContext);

          let email = initialEmail;
          let firstName = initialFirstName || "";
          let lastName = initialLastName || "";

          // Defensive fallback: resolve missing Clerk profile fields from Clerk API.
          if (!email || !firstName || !lastName) {
            try {
              const clerkUser = await clerkClient?.users?.getUser?.(clerkUserId);
              email = email || getPrimaryClerkEmail(clerkUser);
              firstName = firstName || clerkUser?.firstName || "";
              lastName = lastName || clerkUser?.lastName || "";
            } catch (error) {
              logger.warn(
                { clerkUserId, error },
                "Failed to resolve Clerk user details during sync"
              );
            }
          }

          if (!email) {
            throw new AuthenticationError(
              "Unable to resolve Clerk account email. Please verify your email and try again."
            );
          }

          logger.info({ clerkUserId }, "[clerk-sync] Syncing Clerk user with database");

          // Check if user already exists (prefer clerk_id match).
          const existingByClerkId = safeQuery<UserRow & { email: string }>(
            db,
            "SELECT id, email FROM users WHERE clerk_id = ?",
            [clerkUserId]
          );
          
          const existingByEmail = safeQuery<UserRow & { clerk_id: string | null; email: string }>(
            db,
            "SELECT id, clerk_id, email FROM users WHERE LOWER(email) = LOWER(?)",
            [email]
          );
          
          logger.info({ 
            foundByClerkId: !!existingByClerkId, 
            foundByEmail: !!existingByEmail,
            clerkUserId,
          }, "[clerk-sync] User lookup results");
          
          if (existingByClerkId) {
            // Update existing user with Clerk ID
            logger.info({ 
              userId: existingByClerkId.id, 
              clerkUserId,
              matchedBy: "clerk_id"
            }, "[clerk-sync] Updating existing user");
            
            // Handle email updates carefully for multi-provider account linking and account merges
            const currentEmail = existingByClerkId.email;
            let emailToUpdate = email;
            
            // Check if incoming email belongs to a DIFFERENT existing user (account merge scenario)
            const emailOwner = safeQuery<{ id: number; clerk_id: string | null }>(
              db,
              "SELECT id, clerk_id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
              [email, existingByClerkId.id]
            );
            
            if (emailOwner) {
              // Account merge scenario: incoming email exists on another database record
              // This happens when Clerk merges two accounts (e.g., Google link to existing account)
              // We should NOT update email - it would violate unique constraint
              // Both accounts need manual merge or the other account should be deleted first
              logger.warn({
                userId: existingByClerkId.id,
                currentEmail,
                incomingEmail: email,
                emailOwnerId: emailOwner.id,
                emailOwnerClerkId: emailOwner.clerk_id,
                clerkUserId,
                matchedBy: "clerk_id"
              }, "[clerk-sync] Account merge scenario detected: incoming email belongs to different user, keeping existing email");
              emailToUpdate = currentEmail;
            } else if (currentEmail && currentEmail.toLowerCase() !== email.toLowerCase()) {
              // Email is different and NOT owned by another user - safe to update
              emailToUpdate = email;
            }
            
            safeExecute(
              db,
              "UPDATE users SET clerk_id = ?, email = ?, first_name = ?, last_name = ? WHERE id = ?",
              [clerkUserId, emailToUpdate, firstName, lastName, existingByClerkId.id]
            );

            return {
              id: existingByClerkId.id,
              clerkId: clerkUserId,
              email: emailToUpdate,
              firstName,
              lastName,
              message: "User synced successfully",
            };
          }

          if (existingByEmail) {
            logger.warn(
              {
                clerkUserId,
                email,
                existingUserId: existingByEmail.id,
                existingClerkId: existingByEmail.clerk_id,
              },
              "[clerk-sync] Refusing to auto-link account by email",
            );
            throw new ConflictError(
              "A user with this email already exists. Please sign in with your existing method or contact support to link accounts.",
            );
          }

          // Create new user
          const userData = withTransaction(db, () => {
            // Insert user
            const userResult = safeExecute(
              db,
              "INSERT INTO users (email, first_name, last_name, clerk_id, password) VALUES (?, ?, ?, ?, ?)",
              [email, firstName, lastName, clerkUserId, "clerk-auth"] // No password for Clerk users
            );
            const userId = Number(userResult.lastInsertRowid);

            // Insert default user details (empty, can be filled later)
            safeExecute(
              db,
              `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
               VALUES (?, NULL, NULL, NULL, NULL, NULL)`,
              [userId]
            );

            // Insert default macro targets
            safeExecute(
              db,
              `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
               VALUES (?, 30, 40, 30, '[]')`,
              [userId]
            );

            return { userId };
          });

          return {
            id: userData.userId,
            clerkId: clerkUserId,
            email,
            firstName,
            lastName,
            message: "User created and synced successfully",
          };
        },
        {
          detail: {
            summary: "Sync Clerk user with database",
            description: "Creates or updates a user in our database based on Clerk authentication",
            tags: ["Auth"],
          },
        }
      )
  );
