export const FREE_TIER_LIMITS = {
  MAX_HABITS: 5,
  // How far back a free account can look, not how long we keep the data.
  // Entries are never deleted: the history is hidden behind the paywall and
  // reappears in full the moment the account upgrades.
  FREE_VISIBLE_HISTORY_DAYS: 7,
  MAX_SAVED_MEALS: 5,
} as const;

export type SubscriptionStatus = "free" | "pro" | "canceled";

/**
 * Who took the money. Web checkout is Stripe, the Android app is Google Play.
 * resolveEntitlements() deliberately does not accept this: what a user can do
 * must never depend on where they paid.
 */
export type BillingProvider = "stripe" | "play";

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
