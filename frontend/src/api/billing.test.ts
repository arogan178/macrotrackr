import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { billingApi } from "./billing";
import { apiClient } from "./core";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("billingApi", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    apiClient.setAuthToken(null);
    apiClient.setGetToken(async () => null);
  });

  afterEach(() => {
    global.fetch = undefined as unknown as typeof fetch;
    vi.restoreAllMocks();
    apiClient.setAuthToken(null);
    apiClient.setGetToken(async () => null);
  });

  it("fetches billing details from the details endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        price: "$9.99",
        paymentMethod: { brand: "visa", last4: "4242" },
        subscription: {
          id: "sub_123",
          status: "active",
          currentPeriodEnd: "2026-05-01T00:00:00.000Z",
          stripeSubscriptionId: "sub_stripe",
        },
        stripeDetails: null,
      }),
    );

    await expect(billingApi.getBillingDetails()).resolves.toMatchObject({
      price: "$9.99",
      paymentMethod: { brand: "visa", last4: "4242" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/billing/details",
      expect.objectContaining({
        credentials: "include",
        headers: {},
      }),
    );
  });

  it("posts cancellation requests to the cancel endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ success: true, message: "Canceled" }),
    );

    await expect(billingApi.cancelSubscription()).resolves.toEqual({
      success: true,
      message: "Canceled",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/billing/cancel",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("creates checkout sessions with a default monthly plan", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ sessionId: "cs_123", url: "https://checkout" }),
    );

    await billingApi.createCheckoutSession({
      successUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/billing/checkout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          successUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
          plan: "monthly",
        }),
      }),
    );
  });

  it("creates billing portal sessions with the provided return URL", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ url: "https://billing-portal" }),
    );

    await expect(
      billingApi.createPortalSession({ returnUrl: "https://app.example.com/settings" }),
    ).resolves.toEqual({ url: "https://billing-portal" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/billing/portal",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ returnUrl: "https://app.example.com/settings" }),
      }),
    );
  });
});
