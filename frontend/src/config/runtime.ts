export type AuthMode = "clerk" | "local";
export type BillingMode = "managed" | "disabled";
export type AnalyticsMode = "posthog" | "disabled";

function resolveAuthMode(rawValue: string | undefined): AuthMode {
  return rawValue === "clerk" ? "clerk" : "local";
}

function resolveBillingMode(
  rawValue: string | undefined,
  authMode: AuthMode,
): BillingMode {
  if (rawValue === "disabled") {
    return "disabled";
  }

  if (authMode === "local") {
    return "disabled";
  }

  return "managed";
}

export function resolveAnalyticsMode(
  rawValue: string | undefined,
  authMode: AuthMode,
): AnalyticsMode {
  if (authMode === "local") {
    return "disabled";
  }

  return rawValue === "posthog" ? "posthog" : "disabled";
}

const authMode = resolveAuthMode(import.meta.env.VITE_AUTH_MODE);
const billingMode = resolveBillingMode(
  import.meta.env.VITE_BILLING_MODE,
  authMode,
);
const analyticsMode = resolveAnalyticsMode(
  import.meta.env.VITE_ANALYTICS_MODE,
  authMode,
);

/**
 * Play product ids. The Android build needs these to open the right purchase
 * sheet. They are not secrets, they are the SKU names from the Play Console.
 */
const playProductIds = {
  monthly: import.meta.env.VITE_GOOGLE_PLAY_PRODUCT_ID_MONTHLY ?? "",
  yearly: import.meta.env.VITE_GOOGLE_PLAY_PRODUCT_ID_YEARLY ?? "",
} as const;

export const runtimeConfig = {
  AUTH_MODE: authMode,
  BILLING_MODE: billingMode,
  ANALYTICS_MODE: analyticsMode,
  PLAY_PRODUCT_IDS: playProductIds,
} as const;

export const isClerkAuthMode = runtimeConfig.AUTH_MODE === "clerk";
export const isLocalAuthMode = runtimeConfig.AUTH_MODE === "local";
export const isManagedBillingMode = runtimeConfig.BILLING_MODE === "managed";

export function playProductIdFor(plan: "monthly" | "yearly"): string | null {
  const productId = runtimeConfig.PLAY_PRODUCT_IDS[plan];

  return productId.length > 0 ? productId : null;
}
