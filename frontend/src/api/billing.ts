import { API_BASE_URL, getHeaders, handleResponse, post } from "@/api/core";

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
  getBillingDetails: async (): Promise<BillingDetailsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/billing/details`, {
      headers: await getHeaders(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as BillingDetailsResponse;
  },

  cancelSubscription: async (): Promise<BillingCancelResponse> => {
    return post<BillingCancelResponse>("/api/billing/cancel");
  },

  createCheckoutSession: async ({
    successUrl,
    cancelUrl,
    plan = "monthly",
  }: CheckoutSessionPayload): Promise<BillingCheckoutSessionResponse> => {
    return post<BillingCheckoutSessionResponse>("/api/billing/checkout", {
      successUrl,
      cancelUrl,
      plan,
    });
  },

  createPortalSession: async (
    returnUrl: string,
  ): Promise<BillingPortalSessionResponse> => {
    return post<BillingPortalSessionResponse>("/api/billing/portal", { returnUrl });
  },
};
