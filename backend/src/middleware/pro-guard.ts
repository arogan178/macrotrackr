// src/middleware/pro-guard.ts
import { Elysia } from "elysia";
import { SubscriptionService } from "../modules/billing/subscription-service";
import { authMiddleware } from "./auth";
import { AuthorizationError, AuthenticationError } from "../lib/errors";
import { logger } from "../lib/logger";

/**
 * Middleware that ensures the user has an active Pro subscription
 * Must be used after authMiddleware to ensure user is authenticated
 */
export const proGuard = new Elysia({ name: "proGuard" })
  .use(authMiddleware)
  .derive({ as: "scoped" }, async ({ user }) => {
    if (!user) {
      throw new AuthenticationError("Authentication required for Pro features");
    }

    try {
      // Check if user has active Pro subscription
      const hasActivePro = await SubscriptionService.hasActiveProSubscription(
        user.userId
      );

      if (!hasActivePro) {
        logger.warn(
          {
            operation: "pro_guard_access_denied",
            userId: user.userId,
          },
          "User attempted to access Pro feature without active subscription"
        );

        throw new AuthorizationError(
          "Pro subscription required. Please upgrade your account to access this feature."
        );
      }

      logger.debug(
        {
          operation: "pro_guard_access_granted",
          userId: user.userId,
        },
        "Pro subscription verified - access granted"
      );

      return { isProUser: true };
    } catch (error) {
      // If it's already an AuthorizationError, re-throw it
      if (
        error instanceof AuthorizationError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      // Log unexpected errors
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "pro_guard_check_failed",
          userId: user.userId,
        },
        "Failed to verify Pro subscription status"
      );

      // Default to denying access on error for security
      throw new AuthorizationError(
        "Unable to verify subscription status. Please try again later."
      );
    }
  });

/**
 * Utility function to check Pro status without throwing
 * Useful for conditional feature display
 */
export const checkProStatus = async (userId: number): Promise<boolean> => {
  try {
    return await SubscriptionService.hasActiveProSubscription(userId);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error : new Error(String(error)),
        operation: "check_pro_status",
        userId,
      },
      "Failed to check Pro subscription status"
    );
    return false; // Default to false on error
  }
};

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

/**
 * Check if a Free user has reached their limit for a specific feature
 */
export const checkFeatureLimit = async (
  userId: number,
  feature: keyof typeof FREE_TIER_LIMITS,
  currentCount: number
): Promise<{ allowed: boolean; limit?: number; message?: string }> => {
  try {
    const isProUser = await SubscriptionService.hasActiveProSubscription(
      userId
    );

    // Pro users have unlimited access
    if (isProUser) {
      return { allowed: true };
    }

    // Check limits for Free users
    const limit = FREE_TIER_LIMITS[feature];

    if (currentCount >= limit) {
      const featureMessages = {
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
      };
    }

    return { allowed: true, limit };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error : new Error(String(error)),
        operation: "check_feature_limit",
        userId,
        feature,
        currentCount,
      },
      "Failed to check feature limit"
    );

    // On error, allow the action but log it
    return { allowed: true };
  }
};

/**
 * Middleware for enforcing feature limits on Free users
 * More lenient than proGuard - allows action but may warn about limits
 */
export const featureLimitGuard = (feature: keyof typeof FREE_TIER_LIMITS) =>
  new Elysia({ name: `featureLimitGuard_${feature}` })
    .use(authMiddleware)
    .derive({ as: "scoped" }, async ({ user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      return {
        async checkLimit(currentCount: number) {
          const result = await checkFeatureLimit(
            user.userId,
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
        isProUser: await checkProStatus(user.userId),
      };
    });
