import { API_BASE_URL, getHeadersAsync, handleResponse, post } from "@/api/core";

export interface BillingDetailsResponse {
  price: string;
  paymentMethod?: {
    brand: string;
    last4: string;
  };
  subscription: {
    status: string;
    plan: string;
    currentPeriodEnd: string;
  } | null;
}

export interface BillingCancelResponse {
  success: boolean;
  message: string;
}

export interface BillingSessionResponse {
  url: string;
}

export const billingApi = {
  getBillingDetails: async (): Promise<BillingDetailsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/billing/details`, {
      headers: await getHeadersAsync(false),
      credentials: "include",
    });
    return (await handleResponse(response)) as BillingDetailsResponse;
  },

  cancelSubscription: async (): Promise<BillingCancelResponse> => {
    return post<BillingCancelResponse>("/api/billing/cancel");
  },

  createCheckoutSession: async (
    successUrl: string,
    cancelUrl: string,
    plan: "monthly" | "yearly" = "monthly",
  ): Promise<BillingSessionResponse> => {
    return post<BillingSessionResponse>("/api/billing/checkout", {
      successUrl,
      cancelUrl,
      plan,
    });
  },

  createPortalSession: async (
    returnUrl: string,
  ): Promise<BillingSessionResponse> => {
    return post<BillingSessionResponse>("/api/billing/portal", { returnUrl });
  },
};
