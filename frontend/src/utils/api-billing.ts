import { post } from "./api-service";

/**
 * Create a Stripe Checkout Session for Pro upgrade
 * @returns {Promise<{ url: string }>} Stripe Checkout URL
 */
export async function createCheckoutSession(): Promise<{ url: string }> {
  return post<{ url: string }>("/api/billing/create-checkout-session");
}

/**
 * Create a Stripe Customer Portal Session for subscription management
 * @returns {Promise<{ url: string }>} Stripe Portal URL
 */
export async function createPortalSession(): Promise<{ url: string }> {
  return post<{ url: string }>("/api/billing/create-portal-session");
}

/**
 * Usage example:
 * import { createCheckoutSession } from '@/utils/api-billing';
 * const { url } = await createCheckoutSession();
 * window.location.href = url;
 */
