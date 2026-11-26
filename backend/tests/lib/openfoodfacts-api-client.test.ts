import { describe, expect, it } from "vitest";

describe("openfoodfacts-api-client", () => {
  describe("utility functions", () => {
    it("normalizes food search queries", async () => {
      const { normalizeFoodSearchQuery } = await import("../../src/services/openfoodfacts-api-client");

      expect(normalizeFoodSearchQuery("  Test  Query  ")).toBe("test query");
    });

    it("parses gram quantities", async () => {
      const { parseQuantity } = await import("../../src/services/openfoodfacts-api-client");

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
});
