export const FREE_TIER_LIMITS = {
  MAX_HABITS: 5,
  DATA_RETENTION_DAYS: 60,
  MAX_SAVED_MEALS: 5,
} as const;

export type SubscriptionStatus = "free" | "pro" | "canceled";

export interface Entitlements {
  hasProAccess: boolean;
  hasPaidPlan: boolean;
  habitLimit: number | null;
}

export function resolveEntitlements({
  isSelfHosted,
  subscriptionStatus,
}: {
  isSelfHosted: boolean;
  subscriptionStatus: SubscriptionStatus;
}): Entitlements {
  const hasProAccess = isSelfHosted || subscriptionStatus === "pro";

  return {
    hasProAccess,
    hasPaidPlan:
      isSelfHosted ||
      subscriptionStatus === "pro" ||
      subscriptionStatus === "canceled",
    habitLimit: hasProAccess ? null : FREE_TIER_LIMITS.MAX_HABITS,
  };
}
