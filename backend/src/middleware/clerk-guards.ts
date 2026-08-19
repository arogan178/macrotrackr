import { Elysia } from "elysia";
import { FREE_TIER_LIMITS } from "@shared/entitlements";
import { AuthenticationError, AuthorizationError } from "../lib/http/errors";
import { logger } from "../lib/observability/logger";
import { SubscriptionService } from "../modules/billing/subscription-service";
import { getConfig } from "../config";

export interface AuthenticatedUser {
  userId: number;
  providerUserId: string;
  authProvider: "clerk" | "local";
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

interface GuardsAuthenticatedContext {
  user: AuthenticatedUser | null;
  path?: string;
}

export const requireAuth = new Elysia({ name: "requireAuth" }).derive(
  { as: "scoped" },
  async (context): Promise<{ authenticatedUser: AuthenticatedUser }> => {
    const { user } = context as unknown as GuardsAuthenticatedContext;

    if (!user) {
      logger.warn({ path: context.path }, "requireAuth: No user in context");
      throw new AuthenticationError("Authentication required. Please sign in.");
    }

    if (!user.userId) {
      logger.warn(
        { path: context.path, clerkUserId: user.providerUserId },
        "requireAuth: No internalUserId - user may not be synced",
      );
      throw new AuthenticationError(
        "Account not fully set up. Please complete your profile.",
      );
    }

    return {
      authenticatedUser: {
        userId: user.userId,
        providerUserId: user.providerUserId,
        authProvider: user.authProvider || "clerk",
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
    };
  },
);

export { FREE_TIER_LIMITS } from "@shared/entitlements";

export type FeatureLimitKey = keyof typeof FREE_TIER_LIMITS;

export interface FeatureLimitResult {
  allowed: boolean;
  limit?: number;
  message?: string;
  isProUser: boolean;
}

async function getRequiredProStatus(userId: number): Promise<boolean> {
  if (getConfig().APP_MODE === "self-hosted") {
    return true;
  }

  try {
    return await SubscriptionService.hasActiveProSubscription(userId);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error : new Error(String(error)),
        operation: "subscription_status_check_failed",
        userId,
      },
      "Failed to verify Pro subscription status",
    );

    throw new AuthorizationError(
      "Unable to verify subscription status. Please try again later.",
    );
  }
}

export const checkFeatureLimit = async (
  userId: number,
  feature: FeatureLimitKey,
  currentCount: number,
): Promise<FeatureLimitResult> => {
  const isProUser = await getRequiredProStatus(userId);

  if (isProUser) {
    return { allowed: true, isProUser: true };
  }

  const limit = FREE_TIER_LIMITS[feature];

  if (currentCount >= limit) {
    const featureMessages: Record<FeatureLimitKey, string> = {
      MAX_HABITS: `You've reached the limit of ${limit} habits on the Free plan. Upgrade to Pro for unlimited habits.`,
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
