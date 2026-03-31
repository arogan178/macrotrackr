import { Elysia } from "elysia";
import { SubscriptionService } from "../modules/billing/subscription-service";
import { AuthorizationError, AuthenticationError } from "../lib/errors";
import { logger } from "../lib/logger";
import type { ClerkAuthContext } from "./clerk-auth";

export interface AuthenticatedUser {
  userId: number;
  clerkUserId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export interface AuthenticatedContext extends ClerkAuthContext {
  authenticatedUser: AuthenticatedUser;
}

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

export const requirePro = new Elysia({ name: "requirePro" })
  .use(requireAuth)
  .derive({ as: "scoped" }, async (context: any) => {
    const { authenticatedUser } = context;
    const hasActivePro = await getRequiredProStatus(authenticatedUser.userId);
    
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

export const FREE_TIER_LIMITS = {
  MAX_GOALS: 3,
  MAX_HABITS: 5,
  MAX_MACRO_ENTRIES_PER_DAY: 20,
  MAX_WEIGHT_ENTRIES_PER_MONTH: 10,
  DATA_RETENTION_DAYS: 60,
  MAX_SAVED_MEALS: 5,
} as const;

export type FeatureLimitKey = keyof typeof FREE_TIER_LIMITS;

export interface FeatureLimitResult {
  allowed: boolean;
  limit?: number;
  message?: string;
  isProUser: boolean;
}

async function getRequiredProStatus(userId: number): Promise<boolean> {
  try {
    return await SubscriptionService.hasActiveProSubscription(userId);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error : new Error(String(error)),
        operation: "subscription_status_check_failed",
        userId,
      },
      "Failed to verify Pro subscription status"
    );

    throw new AuthorizationError(
      "Unable to verify subscription status. Please try again later."
    );
  }
}

export const checkFeatureLimit = async (
  userId: number,
  feature: FeatureLimitKey,
  currentCount: number
): Promise<FeatureLimitResult> => {
  const isProUser = await getRequiredProStatus(userId);

  if (isProUser) {
    return { allowed: true, isProUser: true };
  }

  const limit = FREE_TIER_LIMITS[feature];

  if (currentCount >= limit) {
    const featureMessages: Record<FeatureLimitKey, string> = {
      MAX_GOALS: `You've reached the limit of ${limit} goals on the Free plan. Upgrade to Pro for unlimited goals.`,
      MAX_HABITS: `You've reached the limit of ${limit} habits on the Free plan. Upgrade to Pro for unlimited habits.`,
      MAX_MACRO_ENTRIES_PER_DAY: `You've reached the daily limit of ${limit} macro entries. Upgrade to Pro for unlimited entries.`,
      MAX_WEIGHT_ENTRIES_PER_MONTH: `You've reached the monthly limit of ${limit} weight entries. Upgrade to Pro for unlimited tracking.`,
      DATA_RETENTION_DAYS: `Data older than ${limit} days is not available on the Free plan. Upgrade to Pro for unlimited data retention.`,
      MAX_SAVED_MEALS: `You've reached the limit of ${limit} saved meals on the Free plan. Upgrade to Pro for unlimited saved meals.`,
    };

    return {
      allowed: false,
      limit,
      message: featureMessages[feature],
      isProUser: false,
    };
  }

  return { allowed: true, limit, isProUser: false };
};

export const checkProStatus = async (userId: number): Promise<boolean> => {
  return getRequiredProStatus(userId);
};

export const featureLimitGuard = (feature: FeatureLimitKey) =>
  new Elysia({ name: `featureLimitGuard_${feature}` })
    .use(requireAuth)
    .derive({ as: "scoped" }, async (context: any) => {
      const authenticatedUser = context.authenticatedUser as
        | AuthenticatedUser
        | undefined;
      const resolvedUserId =
        authenticatedUser?.userId ??
        (typeof context.internalUserId === "number" ? context.internalUserId : null) ??
        (typeof context.user?.userId === "number" ? context.user.userId : null);

      if (!resolvedUserId) {
        logger.warn(
          {
            path: context.path,
            hasAuthenticatedUser: Boolean(authenticatedUser),
            hasInternalUserId: typeof context.internalUserId === "number",
            hasContextUserId: typeof context.user?.userId === "number",
          },
          `featureLimitGuard_${feature}: Unable to resolve authenticated user ID`
        );
        throw new AuthenticationError("Authentication required. Please sign in.");
      }
      
      return {
        async checkLimit(currentCount: number): Promise<FeatureLimitResult> {
          const result = await checkFeatureLimit(
            resolvedUserId,
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
        isProUser: await checkProStatus(resolvedUserId),
      };
    });
