import { apiClient, type ApiError } from "@/api/core";

export interface BillingSubscriptionDetails {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
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

export interface CheckoutSessionPayload {
  successUrl: string;
  cancelUrl: string;
  plan?: "monthly" | "yearly";
}

export const billingApi = {
  /**
   * @throws {ApiError}
   */
  getBillingDetails: async (): Promise<BillingDetailsResponse> => {
    return apiClient.get<BillingDetailsResponse>("/api/billing/details");
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
