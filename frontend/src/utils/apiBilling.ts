/**
 * Cancel the current user's subscription
 * @returns {Promise<{ success: boolean, message: string }>}
 */
import { post } from "./apiServices";

export async function cancelSubscription(): Promise<{
  success: boolean;
  message: string;
}> {
  return post<{ success: boolean; message: string }>("/api/billing/cancel");
}

/**
 * Create a Stripe Checkout Session for Pro upgrade
 * @param successUrl - URL to redirect after successful payment
 * @param cancelUrl - URL to redirect if checkout is cancelled
 * @returns {Promise<{ url: string }>} Stripe Checkout URL
 */
export async function createCheckoutSession(
  successUrl: string,
  cancelUrl: string,
  plan: "monthly" | "yearly" = "monthly",
): Promise<{ url: string }> {
  return post<{ url: string }>("/api/billing/checkout", {
    successUrl,
    cancelUrl,
    plan,
  });
}

/**
 * Create a Stripe Customer Portal Session for subscription management
 * @param returnUrl - The URL to return to after managing the subscription
 * @returns {Promise<{ url: string }>} Stripe Portal URL
 */
export async function createPortalSession(
  returnUrl: string,
): Promise<{ url: string }> {
  return post<{ url: string }>("/api/billing/portal", { returnUrl });
}

/**
 * Usage example:
 * import { createCheckoutSession } from '@/utils/api-billing';
 * const { url } = await createCheckoutSession();
 * window.location.href = url;
 */
