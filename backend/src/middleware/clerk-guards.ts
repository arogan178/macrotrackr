// src/middleware/clerk-guards.ts
/**
 * Clerk-compatible guard helpers for authentication and authorization.
 * These guards work with the global clerkAuthMiddleware context.
 * 
 * @see plans/roadmap-a-auth-consolidation.md for migration details
 */

import { Elysia } from "elysia";
import { SubscriptionService } from "../modules/billing/subscription-service";
import { AuthorizationError, AuthenticationError } from "../lib/errors";
import { logger } from "../lib/logger";
import type { ClerkAuthContext } from "./clerkAuth";

/**
 * Authenticated user shape for route handlers
 */
export interface AuthenticatedUser {
  userId: number;
  clerkUserId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

/**
 * Extended context with authenticated user
 */
export interface AuthenticatedContext extends ClerkAuthContext {
  authenticatedUser: AuthenticatedUser;
}

/**
 * Guard that ensures user is authenticated via Clerk.
 * Must be used after clerkAuthMiddleware (applied globally in index.ts).
 * 
 * @example
 * ```typescript
 * app.use(requireAuth)
 *   .get("/protected", ({ authenticatedUser }) => {
 *     return { userId: authenticatedUser.userId };
 *   });
 * ```
 */
export const requireAuth = new Elysia({ name: "requireAuth" })
  .derive({ as: "scoped" }, async (context: any): Promise<{ authenticatedUser: AuthenticatedUser }> => {
    const { user, internalUserId } = context as ClerkAuthContext;
    
    if (!user) {
      logger.warn({ path: context.path }, "requireAuth: No user in context");
      throw new AuthenticationError("Authentication required. Please sign in.");
    }
    
    if (!internalUserId) {
      logger.warn(
        { path: context.path, clerkUserId: user.clerkUserId }, 
        "requireAuth: No internalUserId - user may not be synced"
      );
      throw new AuthenticationError(
        "Account not fully set up. Please complete your profile."
      );
    }
    
    return {
      authenticatedUser: {
        userId: internalUserId,
        clerkUserId: user.clerkUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
    };
  });

/**
 * Guard that ensures user has an active Pro subscription.
 * Must be used after clerkAuthMiddleware (applied globally in index.ts).
 * 
 * @example
 * ```typescript
 * app.use(requirePro)
 *   .get("/pro-feature", ({ authenticatedUser, isProUser }) => {
 *     return { message: "Pro feature accessed" };
 *   });
 * ```
 */
export const requirePro = new Elysia({ name: "requirePro" })
  .use(requireAuth)
  .derive({ as: "scoped" }, async (context: any) => {
    const { authenticatedUser } = context;
    
    let hasActivePro = false;
    
    try {
      hasActivePro = await SubscriptionService.hasActiveProSubscription(
        authenticatedUser.userId
      );
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "requirePro_check_failed",
          userId: authenticatedUser.userId,
        },
        "Failed to verify Pro subscription status"
      );
      throw new AuthorizationError(
        "Unable to verify subscription status. Please try again later."
      );
    }
    
    if (!hasActivePro) {
      logger.warn(
        {
          operation: "requirePro_access_denied",
          userId: authenticatedUser.userId,
        },
        "User attempted to access Pro feature without active subscription"
      );
      throw new AuthorizationError(
        "Pro subscription required. Please upgrade your account to access this feature."
      );
    }
    
    return { isProUser: true };
  });

/**
 * Pro feature limits for Free users
 */
export const FREE_TIER_LIMITS = {
  MAX_GOALS: 3,
  MAX_HABITS: 5,
  MAX_MACRO_ENTRIES_PER_DAY: 20,
  MAX_WEIGHT_ENTRIES_PER_MONTH: 10,
  DATA_RETENTION_DAYS: 90,
} as const;

export type FeatureLimitKey = keyof typeof FREE_TIER_LIMITS;

/**
 * Result of checking a feature limit
 */
export interface FeatureLimitResult {
  allowed: boolean;
  limit?: number;
  message?: string;
  isProUser: boolean;
}

/**
 * Check if a Free user has reached their limit for a specific feature.
 * Pro users always have unlimited access.
 * 
 * @param userId - Internal user ID
 * @param feature - The feature to check
 * @param currentCount - Current usage count
 * @returns Feature limit result with allowed status and message
 */
export const checkFeatureLimit = async (
  userId: number,
  feature: FeatureLimitKey,
  currentCount: number
): Promise<FeatureLimitResult> => {
  try {
    const isProUser = await SubscriptionService.hasActiveProSubscription(userId);

    // Pro users have unlimited access
    if (isProUser) {
      return { allowed: true, isProUser: true };
    }

    // Check limits for Free users
    const limit = FREE_TIER_LIMITS[feature];

    if (currentCount >= limit) {
      const featureMessages: Record<FeatureLimitKey, string> = {
        MAX_GOALS: `You've reached the limit of ${limit} goals on the Free plan. Upgrade to Pro for unlimited goals.`,
        MAX_HABITS: `You've reached the limit of ${limit} habits on the Free plan. Upgrade to Pro for unlimited habits.`,
        MAX_MACRO_ENTRIES_PER_DAY: `You've reached the daily limit of ${limit} macro entries. Upgrade to Pro for unlimited entries.`,
        MAX_WEIGHT_ENTRIES_PER_MONTH: `You've reached the monthly limit of ${limit} weight entries. Upgrade to Pro for unlimited tracking.`,
        DATA_RETENTION_DAYS: `Data older than ${limit} days is not available on the Free plan. Upgrade to Pro for unlimited data retention.`,
      };

      return {
        allowed: false,
        limit,
        message: featureMessages[feature],
        isProUser: false,
      };
    }

    return { allowed: true, limit, isProUser: false };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error : new Error(String(error)),
        operation: "checkFeatureLimit",
        userId,
        feature,
        currentCount,
      },
      "Failed to check feature limit"
    );

    // On error, allow the action but log it
    return { allowed: true, isProUser: false };
  }
};

/**
 * Utility function to check Pro status without throwing.
 * Useful for conditional feature display.
 * 
 * @param userId - Internal user ID
 * @returns Whether the user has an active Pro subscription
 */
export const checkProStatus = async (userId: number): Promise<boolean> => {
  try {
    return await SubscriptionService.hasActiveProSubscription(userId);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error : new Error(String(error)),
        operation: "checkProStatus",
        userId,
      },
      "Failed to check Pro subscription status"
    );
    return false;
  }
};

/**
 * Middleware for enforcing feature limits on Free users.
 * More lenient than requirePro - allows action but may warn about limits.
 * 
 * @param feature - The feature to check limits for
 * 
 * @example
 * ```typescript
 * app.use(featureLimitGuard("MAX_GOALS"))
 *   .post("/goals", async ({ authenticatedUser, checkLimit }) => {
 *     const currentCount = await getGoalCount(authenticatedUser.userId);
 *     await checkLimit(currentCount); // Throws if limit reached
 *     // ... create goal
 *   });
 * ```
 */
export const featureLimitGuard = (feature: FeatureLimitKey) =>
  new Elysia({ name: `featureLimitGuard_${feature}` })
    .use(requireAuth)
    .derive({ as: "scoped" }, async (context: any) => {
      const { authenticatedUser } = context;
      
      return {
        async checkLimit(currentCount: number): Promise<FeatureLimitResult> {
          const result = await checkFeatureLimit(
            authenticatedUser.userId,
            feature,
            currentCount
          );

          if (!result.allowed) {
            throw new AuthorizationError(
              result.message || "Feature limit reached"
            );
          }

          return result;
        },
        isProUser: await checkProStatus(authenticatedUser.userId),
      };
    });
