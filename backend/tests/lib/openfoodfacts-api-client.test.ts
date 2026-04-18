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

    it("parses fl oz quantities to ml", async () => {
      const { parseQuantity } = await import("../../src/services/openfoodfacts-api-client");

      expect(parseQuantity("12 fl oz")).toEqual({
        quantity: 354.88,
        unit: "ml",
      });
    });

    it("parses count-based quantities as unit servings", async () => {
      const { parseQuantity } = await import("../../src/services/openfoodfacts-api-client");

      expect(parseQuantity("6 eggs")).toEqual({
        quantity: 6,
        unit: "unit",
      });
      expect(parseQuantity("Eggs")).toEqual({
        quantity: 1,
        unit: "unit",
      });
    });

    it("ranks simple whole-food matches above noisy branded products", async () => {
      const { rankAndNormalizeFoodProducts } = await import(
        "../../src/services/openfoodfacts-api-client"
      );

      const hits = [
        {
          product_name: "Chicken curry flavour instant noodles",
          categories: "Meals, Instant noodles",
          quantity: "85 g",
          nutriments: {
            proteins_100g: 8,
            carbohydrates_100g: 64,
            fat_100g: 18,
            "energy-kcal_100g": 460,
          },
        },
        {
          product_name: "Chicken",
          categories: "Meats, Chicken",
          quantity: "500 g",
          nutriments: {
            proteins_100g: 23,
            carbohydrates_100g: 0,
            fat_100g: 2,
            "energy-kcal_100g": 120,
          },
        },
      ];

      const results = rankAndNormalizeFoodProducts(hits, "chicken");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name.toLowerCase()).toBe("chicken");
    });

    it("deduplicates repeated generic egg entries with the same nutrition", async () => {
      const { rankAndNormalizeFoodProducts } = await import(
        "../../src/services/openfoodfacts-api-client"
      );

      const hits = [
        {
          product_name: "Eggs",
          categories: "Eggs",
          quantity: "6 eggs",
          nutriments: {
            proteins_100g: 12.6,
            carbohydrates_100g: 0.2,
            fat_100g: 9,
            "energy-kcal_100g": 132,
          },
        },
        {
          product_name: "Eggs",
          categories: "Eggs",
          quantity: "12 eggs",
          nutriments: {
            proteins_100g: 12.6,
            carbohydrates_100g: 0.2,
            fat_100g: 9,
            "energy-kcal_100g": 132,
          },
        },
        {
          product_name: "Eggs from caged hens",
          categories: "Eggs",
          quantity: "805 g",
          nutriments: {
            proteins_100g: 12.6,
            carbohydrates_100g: 0.1,
            fat_100g: 9,
            "energy-kcal_100g": 131,
          },
        },
      ];

      const results = rankAndNormalizeFoodProducts(hits, "eggs");
      const exactEggs = results.filter((result) => result.name.toLowerCase() === "eggs");

      expect(exactEggs).toHaveLength(1);
    });

    it("collapses exact singular food names for single-token queries", async () => {
      const { rankAndNormalizeFoodProducts } = await import(
        "../../src/services/openfoodfacts-api-client"
      );

      const hits = [
        {
          product_name: "Eggs",
          categories: "Eggs",
          quantity: "6 eggs",
          nutriments: {
            proteins_100g: 12.6,
            carbohydrates_100g: 0.2,
            fat_100g: 9,
            "energy-kcal_100g": 132,
          },
        },
        {
          product_name: "Eggs",
          categories: "Eggs",
          quantity: "15 eggs",
          nutriments: {
            proteins_100g: 13,
            carbohydrates_100g: 0.5,
            fat_100g: 9,
            "energy-kcal_100g": 131,
          },
        },
        {
          product_name: "Eggs large",
          categories: "Eggs",
          quantity: "12 eggs",
          nutriments: {
            proteins_100g: 12.5,
            carbohydrates_100g: 0,
            fat_100g: 9,
            "energy-kcal_100g": 130,
          },
        },
      ];

      const results = rankAndNormalizeFoodProducts(hits, "eggs");
      const exactEggs = results.filter((result) => result.name.toLowerCase() === "eggs");

      expect(exactEggs).toHaveLength(1);
      expect(results.length).toBe(2);
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
