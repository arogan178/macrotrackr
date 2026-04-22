export type AuthMode = "clerk" | "local";
export type BillingMode = "managed" | "disabled";
export type AnalyticsMode = "posthog" | "disabled";

function resolveAuthMode(rawValue: string | undefined): AuthMode {
  return rawValue === "local" ? "local" : "clerk";
}

function resolveBillingMode(rawValue: string | undefined, authMode: AuthMode): BillingMode {
  if (rawValue === "disabled") {
    return "disabled";
  }

  if (authMode === "local") {
    return "disabled";
  }

  return "managed";
}

function resolveAnalyticsMode(rawValue: string | undefined, authMode: AuthMode): AnalyticsMode {
  if (rawValue === "posthog") {
    return "posthog";
  }

  if (authMode === "local") {
    return "disabled";
  }

  return "disabled";
}

const authMode = resolveAuthMode(import.meta.env.VITE_AUTH_MODE);
const billingMode = resolveBillingMode(import.meta.env.VITE_BILLING_MODE, authMode);
const analyticsMode = resolveAnalyticsMode(import.meta.env.VITE_ANALYTICS_MODE, authMode);

export const runtimeConfig = {
  AUTH_MODE: authMode,
  BILLING_MODE: billingMode,
  ANALYTICS_MODE: analyticsMode,
} as const;

export const isClerkAuthMode = runtimeConfig.AUTH_MODE === "clerk";
export const isLocalAuthMode = runtimeConfig.AUTH_MODE === "local";
export const isManagedBillingMode = runtimeConfig.BILLING_MODE === "managed";
