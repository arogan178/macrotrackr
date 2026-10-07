import { api, unwrap } from "@/api/core";

export interface BillingSubscriptionDetails {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  provider: "stripe" | "play";
  providerSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingDetailsResponse {
  price: string | null;
  paymentMethod: {
    brand: string;
    last4: string;
  } | null;
  subscription: BillingSubscriptionDetails | null;
  stripeDetails: unknown | null;
}

export interface BillingCancelResponse {
  success: boolean;
  message: string;
}

export interface BillingCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface BillingPortalSessionResponse {
  url: string;
}

export interface BillingCapabilitiesResponse {
  /** Stripe checkout on the web. */
  web: boolean;
  /** Google Play Billing in the Android app. */
  play: boolean;
}

export interface PlayVerifyResponse {
  status: string;
  currentPeriodEnd: string;
  entitled: boolean;
  plan: "monthly" | "yearly" | "unknown";
}

export interface CheckoutSessionPayload {
  successUrl: string;
  cancelUrl: string;
  plan?: "monthly" | "yearly";
}

export const billingApi = {
  /**
   * What this deployment can sell, and through which provider. Public, so it
   * works before sign-in on the pricing page.
   *
   * @throws {ApiError}
   */
  getCapabilities: async (): Promise<BillingCapabilitiesResponse> => {
    return unwrap(api.api.billing.capabilities.get());
  },

  /**
   * @throws {ApiError}
   */
  getBillingDetails: async (): Promise<BillingDetailsResponse> => {
    return unwrap(api.api.billing.details.get());
  },

  /**
   * This account's opaque Play account token, created on first use. Passed to
   * Play at purchase time so notifications can be traced back to the account.
   *
   * @throws {ApiError}
   */
  getPlayAccountToken: async (): Promise<{ accountToken: string }> => {
    return unwrap(api.api.billing.play["account-token"].get());
  },

  /**
   * Hand a Google Play purchase token to the server so it can ask Google what
   * the purchase is worth and grant Pro. Entitlement is decided server-side,
   * so a token that Play has already expired buys nothing.
   *
   * @throws {ApiError}
   */
  verifyPlayPurchase: async (
    purchaseToken: string,
  ): Promise<PlayVerifyResponse> => {
    return unwrap(api.api.billing.play.verify.post({ purchaseToken }));
  },

  /**
   * @throws {ApiError}
   */
  cancelSubscription: async (): Promise<BillingCancelResponse> => {
    return unwrap(api.api.billing.cancel.post());
  },

  /**
   * @throws {ApiError}
   */
  createCheckoutSession: async ({
    successUrl,
    cancelUrl,
    plan = "monthly",
  }: CheckoutSessionPayload): Promise<BillingCheckoutSessionResponse> => {
    return unwrap(
      api.api.billing.checkout.post({ successUrl, cancelUrl, plan }),
    );
  },

  /**
   * @throws {ApiError}
   */
  createPortalSession: async ({ returnUrl }: { returnUrl: string }): Promise<BillingPortalSessionResponse> => {
    return unwrap(api.api.billing.portal.post({ returnUrl }));
  },
};
