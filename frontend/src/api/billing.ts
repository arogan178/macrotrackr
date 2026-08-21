import { apiClient } from "@/api/core";

export interface BillingSubscriptionDetails {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  provider: "stripe" | "play";
  providerSubscriptionId: string | null;
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
    return apiClient.get<BillingCapabilitiesResponse>(
      "/api/billing/capabilities",
    );
  },

  /**
   * @throws {ApiError}
   */
  getBillingDetails: async (): Promise<BillingDetailsResponse> => {
    return apiClient.get<BillingDetailsResponse>("/api/billing/details");
  },

  /**
   * This account's opaque Play account token, created on first use. Passed to
   * Play at purchase time so notifications can be traced back to the account.
   *
   * @throws {ApiError}
   */
  getPlayAccountToken: async (): Promise<{ accountToken: string }> => {
    return apiClient.get<{ accountToken: string }>(
      "/api/billing/play/account-token",
    );
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
    return apiClient.post<PlayVerifyResponse>("/api/billing/play/verify", {
      purchaseToken,
    });
  },

  /**
   * @throws {ApiError}
   */
  cancelSubscription: async (): Promise<BillingCancelResponse> => {
    return apiClient.post<BillingCancelResponse>("/api/billing/cancel");
  },

  /**
   * @throws {ApiError}
   */
  createCheckoutSession: async ({
    successUrl,
    cancelUrl,
    plan = "monthly",
  }: CheckoutSessionPayload): Promise<BillingCheckoutSessionResponse> => {
    return apiClient.post<BillingCheckoutSessionResponse>("/api/billing/checkout", {
      successUrl,
      cancelUrl,
      plan,
    });
  },

  /**
   * @throws {ApiError}
   */
  createPortalSession: async ({ returnUrl }: { returnUrl: string }): Promise<BillingPortalSessionResponse> => {
    return apiClient.post<BillingPortalSessionResponse>("/api/billing/portal", { returnUrl });
  },
};
