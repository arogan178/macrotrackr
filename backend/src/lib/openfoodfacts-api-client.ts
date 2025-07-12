// src/lib/openfoodfacts-api-client.ts

import { loggerHelpers } from "./logger";

const API_URL = "https://world.openfoodfacts.org/api/v2/search";

export type FoodProduct = {
  product_name: string;
  nutriments: {
    "energy-kcal_100g": number;
    proteins_100g: number;
    carbohydrates_100g: number;
    fat_100g: number;
  };
};

export class OpenFoodFactsApiClient {
  async search(query: string): Promise<FoodProduct | null> {
    const url = `${API_URL}?search_terms=${encodeURIComponent(
      query
    )}&fields=product_name,nutriments&json=true&page_size=5`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        loggerHelpers.error(new Error("OpenFoodFacts API request failed"), {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const data = await response.json();
      if (data.products && data.products.length > 0) {
        // Try to find a good match
        const lowerCaseQuery = query.toLowerCase();
        const bestMatch = data.products.find((p: FoodProduct) =>
          p.product_name?.toLowerCase().includes(lowerCaseQuery)
        );

        return bestMatch || data.products[0]; // Return best match or fallback to the first one
      }

      return null;
    } catch (error) {
      loggerHelpers.error(new Error("Failed to fetch from OpenFoodFacts API"), {
        error,
      });
      return null;
    }
  }
}
