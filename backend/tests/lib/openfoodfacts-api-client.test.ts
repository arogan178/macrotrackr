import { describe, expect, it, vi, beforeEach } from "vitest";

describe("openfoodfacts-api-client", () => {
  // Stub env before importing anything
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CLERK_PUBLISHABLE_KEY", "pk_test");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
  });

  describe("OpenFoodFactsApiClient", () => {
    it("is exported as a class", async () => {
      const { OpenFoodFactsApiClient } = await import("../../src/services/openfoodfacts-api-client");
      
      expect(OpenFoodFactsApiClient).toBeDefined();
      expect(typeof OpenFoodFactsApiClient).toBe("function");
    });

    it("can be instantiated", async () => {
      const { OpenFoodFactsApiClient } = await import("../../src/services/openfoodfacts-api-client");
      
      const client = new OpenFoodFactsApiClient();
      expect(client).toBeDefined();
    });

    it("has search method", async () => {
      const { OpenFoodFactsApiClient } = await import("../../src/services/openfoodfacts-api-client");
      
      const client = new OpenFoodFactsApiClient();
      expect(typeof client.search).toBe("function");
    });
  });

  describe("utility functions", () => {
    it("exports normalizeFoodSearchQuery", async () => {
      const { normalizeFoodSearchQuery } = await import("../../src/services/openfoodfacts-api-client");
      
      expect(typeof normalizeFoodSearchQuery).toBe("function");
      expect(normalizeFoodSearchQuery("  Test  Query  ")).toBe("test query");
    });

    it("exports buildFoodSearchCacheKey", async () => {
      const { buildFoodSearchCacheKey } = await import("../../src/services/openfoodfacts-api-client");
      
      expect(typeof buildFoodSearchCacheKey).toBe("function");
    });

    it("exports parseQuantity", async () => {
      const { parseQuantity } = await import("../../src/services/openfoodfacts-api-client");
      
      expect(typeof parseQuantity).toBe("function");
      expect(parseQuantity("100g").quantity).toBe(100);
    });
  });

  describe("error classes", () => {
    it("exports OpenFoodFactsError", async () => {
      const { OpenFoodFactsError } = await import("../../src/services/openfoodfacts-api-client");
      
      expect(OpenFoodFactsError).toBeDefined();
      expect(typeof OpenFoodFactsError).toBe("function");
    });

    it("exports OpenFoodFactsTimeoutError", async () => {
      const { OpenFoodFactsTimeoutError } = await import("../../src/services/openfoodfacts-api-client");
      
      expect(OpenFoodFactsTimeoutError).toBeDefined();
    });

    it("exports OpenFoodFactsRateLimitError", async () => {
      const { OpenFoodFactsRateLimitError } = await import("../../src/services/openfoodfacts-api-client");
      
      expect(OpenFoodFactsRateLimitError).toBeDefined();
    });
  });
});
