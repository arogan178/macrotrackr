// src/lib/openfoodfacts-api-client.ts

import { logger, loggerHelpers } from "./logger";

// Use the search-a-licious API for full-text search
const API_URL = "https://search.openfoodfacts.org/search";
const USER_AGENT = "MacroTracker/1.0 (contact@example.com)";

// Updated types for the search-a-licious API response
export type FoodProduct = {
  product_name: string;
  product_name_en?: string;
  categories: string;
  quantity?: string;
  nutriments: {
    "energy-kcal_100g"?: number | string;
    proteins_100g?: number | string;
    carbohydrates_100g?: number | string;
    fat_100g?: number | string;
  };
};

export type FoodProductResult = {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  energyKcal: number;
  categories: string;
  servingQuantity: number;
  servingUnit: string;
  rawQuantity?: string;
};

export class OpenFoodFactsApiClient {
  async search(query: string): Promise<FoodProductResult[]> {
    // Add quantity to the fields requested from the API
    const url = `${API_URL}?q=${encodeURIComponent(
      query
    )}&lc=en&search_simple=1&fields=product_name,product_name_en,nutriments,categories,quantity`;

    logger.debug({ url }, "Requesting URL from search-a-licious API");

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        loggerHelpers.error(new Error("search-a-licious API request failed"), {
          status: response.status,
          statusText: response.statusText,
        });
        return [];
      }

      const data = await response.json();

      logger.debug(
        { products: data.hits?.slice(0, 5) },
        "search-a-licious API raw response"
      );

      if (data.hits && data.hits.length > 0) {
        const mapped: FoodProductResult[] = data.hits
          .filter((hit: any) => hit) // Filter out any null/undefined hits
          .map((hit: any) => {
            const p = hit;
            const n = p.nutriments || {};

            let servingQuantity = 100;
            let servingUnit = "g";
            let rawQuantity = p.quantity ? p.quantity.toString() : undefined;

            if (rawQuantity) {
              const quantityString = rawQuantity.toLowerCase();
              const match = quantityString.match(/([\d.]+)\s*(\w*)/);
              if (match) {
                servingQuantity = parseFloat(match[1]) || 100;
                servingUnit = match[2] || "g";
              }
            }

            return {
              name: p.product_name_en || p.product_name || "Unknown",
              protein: Number.parseFloat(n.proteins_100g?.toString() || "0"),
              carbs: Number.parseFloat(n.carbohydrates_100g?.toString() || "0"),
              fats: Number.parseFloat(n.fat_100g?.toString() || "0"),
              energyKcal: Number.parseFloat(
                n["energy-kcal_100g"]?.toString() || "0"
              ),
              categories: p.categories || "",
              servingQuantity,
              servingUnit,
              rawQuantity,
            };
          })
          .filter((p: FoodProductResult) => p.name !== "Unknown");

        return mapped.slice(0, 10);
      }

      return [];
    } catch (error) {
      loggerHelpers.error(
        new Error("Failed to fetch from search-a-licious API"),
        {
          error:
            error instanceof Error ?
              { message: error.message, stack: error.stack, name: error.name }
            : error,
        }
      );
      return [];
    }
  }
}
