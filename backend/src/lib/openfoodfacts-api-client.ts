// src/lib/openfoodfacts-api-client.ts

import { logger, loggerHelpers } from "./logger";

// Use the search-a-licious API for full-text search
const API_URL = "https://search.openfoodfacts.org/search";
const USER_AGENT = "MacroTracker/1.0 (contact@example.com)";

// Configuration constants
const MAX_RESULTS = 10;
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

// Enhanced types for better type safety
export interface FoodProductNutriments {
  "energy-kcal_100g"?: number | string;
  proteins_100g?: number | string;
  carbohydrates_100g?: number | string;
  fat_100g?: number | string;
}

export interface FoodProduct {
  product_name: string;
  product_name_en?: string;
  categories?: string;
  quantity?: string;
  nutriments?: FoodProductNutriments;
}

export interface FoodSearchHit {
  product_name?: string;
  product_name_en?: string;
  categories?: string;
  quantity?: string;
  nutriments?: FoodProductNutriments;
}

export interface FoodSearchResponse {
  hits?: FoodSearchHit[];
  count?: number;
  timed_out?: boolean;
}

export interface FoodProductResult {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  energyKcal: number;
  categories: string;
  servingQuantity: number;
  servingUnit: string;
  rawQuantity?: string;
}

export interface QuantityParseResult {
  quantity: number;
  unit: string;
}

// Custom error classes for better error handling
export class OpenFoodFactsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "OpenFoodFactsError";
  }
}

export class OpenFoodFactsTimeoutError extends OpenFoodFactsError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = "OpenFoodFactsTimeoutError";
  }
}

export class OpenFoodFactsRateLimitError extends OpenFoodFactsError {
  constructor(_retryAfter?: number) {
    super("Rate limit exceeded");
    this.name = "OpenFoodFactsRateLimitError";
  }
}

// Utility functions for better code organization
function parseQuantity(quantityString: string): QuantityParseResult {
  if (!quantityString || typeof quantityString !== "string") {
    return { quantity: 100, unit: "g" };
  }

  const cleanedString = quantityString.toLowerCase().trim();

  // Handle various quantity formats
  const patterns = [
    // "90 g", "90g", "90 grams"
    /([\d.,]+)\s*(?:g|gram|grams?)/,
    // "1.5 kg", "1.5kg"
    /([\d.,]+)\s*(?:kg|kilogram|kilograms?)/,
    // "16 oz", "16oz"
    /([\d.,]+)\s*(?:oz|ounce|ounces?)/,
    // "2 lb", "2lbs", "2 pounds"
    /([\d.,]+)\s*(?:lb|lbs|pound|pounds)/,
    // "500 ml", "500ml", "500 milliliters"
    /([\d.,]+)\s*(?:ml|milliliter|milliliters)/,
    // "1.5 L", "1.5L", "1.5 liter"
    /([\d.,]+)\s*(?:l|liter|liters)/,
    // "1 cup", "1cup"
    /([\d.,]+)\s*(?:cup|cups)/,
    // "2 tbsp", "2 tablespoons"
    /([\d.,]+)\s*(?:tbsp|tablespoon|tablespoons)/,
    // "1 tsp", "1 teaspoon"
    /([\d.,]+)\s*(?:tsp|teaspoon|teaspoons)/,
    // "1 pt", "1 pint"
    /([\d.,]+)\s*(?:pt|pint|pints)/,
  ];

  for (const pattern of patterns) {
    const match = cleanedString.match(pattern);
    if (match && match[1]) {
      const quantityStr = match[1].replace(",", ".");
      const quantity = parseFloat(quantityStr);
      if (!isNaN(quantity) && quantity > 0) {
        // Map common units to standardized units
        const unitMap: Record<string, string> = {
          g: "g",
          gram: "g",
          grams: "g",
          kg: "kg",
          kilogram: "kg",
          kilograms: "kg",
          oz: "oz",
          ounce: "oz",
          ounces: "oz",
          lb: "lb",
          lbs: "lb",
          pound: "lb",
          pounds: "lb",
          ml: "ml",
          milliliter: "ml",
          milliliters: "ml",
          l: "L",
          liter: "L",
          liters: "L",
          cup: "cup",
          cups: "cup",
          tbsp: "tbsp",
          tablespoon: "tbsp",
          tablespoons: "tbsp",
          tsp: "tsp",
          teaspoon: "tsp",
          teaspoons: "tsp",
          pt: "pt",
          pint: "pt",
          pints: "pt",
        };

        const rawUnit = match[2] || "";
        return {
          quantity,
          unit: unitMap[rawUnit] || rawUnit || "g",
        };
      }
    }
  }

  // Fallback for unrecognized formats
  return { quantity: 100, unit: "g" };
}

function parseNutrientValue(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;

  const stringValue = value.toString().trim();
  if (!stringValue) return 0;

  const parsed = parseFloat(stringValue);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

function isValidFoodProduct(hit: FoodSearchHit): boolean {
  if (!hit || typeof hit !== "object") return false;

  // Must have a product name
  const hasName = Boolean(hit.product_name || hit.product_name_en);
  if (!hasName) return false;

  // Must have some nutritional data
  const nutriments = hit.nutriments;
  if (!nutriments || typeof nutriments !== "object") return false;

  // Check if we have at least one meaningful nutrient value
  const hasNutrients =
    parseNutrientValue(nutriments.proteins_100g) > 0 ||
    parseNutrientValue(nutriments.carbohydrates_100g) > 0 ||
    parseNutrientValue(nutriments.fat_100g) > 0 ||
    parseNutrientValue(nutriments["energy-kcal_100g"]) > 0;

  return hasNutrients;
}

function mapHitToFoodProduct(hit: FoodSearchHit): FoodProductResult {
  const nutriments = hit.nutriments || {};

  // Parse quantity information
  const { quantity: servingQuantity, unit: servingUnit } = parseQuantity(
    hit.quantity || ""
  );

  const rawQuantity = hit.quantity;

  return {
    name: hit.product_name_en || hit.product_name || "Unknown Product",
    protein: parseNutrientValue(nutriments.proteins_100g),
    carbs: parseNutrientValue(nutriments.carbohydrates_100g),
    fats: parseNutrientValue(nutriments.fat_100g),
    energyKcal: parseNutrientValue(nutriments["energy-kcal_100g"]),
    categories: hit.categories || "",
    servingQuantity,
    servingUnit,
    rawQuantity,
  };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class OpenFoodFactsApiClient {
  private retryCount = 0;

  async search(query: string): Promise<FoodProductResult[]> {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      logger.warn("Empty or invalid search query provided");
      return [];
    }

    const trimmedQuery = query.trim();
    const url = `${API_URL}?q=${encodeURIComponent(
      trimmedQuery
    )}&lc=en&search_simple=1&fields=product_name,product_name_en,nutriments,categories,quantity`;

    logger.debug({ url, query: trimmedQuery }, "Requesting URL from search-a-licious API");

    return this.makeRequest(url);
  }

  private async makeRequest(url: string): Promise<FoodProductResult[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleHttpError(response);
        return [];
      }

      const data: FoodSearchResponse = await response.json();

      if (!data || !Array.isArray(data.hits)) {
        logger.warn({ data }, "Invalid API response structure");
        return [];
      }

      const validHits = data.hits
        .filter(isValidFoodProduct)
        .map(mapHitToFoodProduct)
        .filter(result => result.name !== "Unknown Product")
        .slice(0, MAX_RESULTS);

      logger.debug(
        {
          query: url,
          totalHits: data.hits.length,
          validResults: validHits.length,
          timedOut: data.timed_out
        },
        "Search completed successfully"
      );

      return validHits;

    } catch (error) {
      return this.handleRequestError(error, url);
    }
  }

  private async handleHttpError(response: Response): Promise<never> {
    let errorMessage = `OpenFoodFacts API error: ${response.status} ${response.statusText}`;

    // Handle specific HTTP status codes
    switch (response.status) {
      case 400:
        errorMessage = "Invalid search query";
        break;
      case 404:
        errorMessage = "No results found";
        break;
      case 429:
        errorMessage = "Rate limit exceeded. Please try again later.";
        throw new OpenFoodFactsRateLimitError();
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = "OpenFoodFacts service temporarily unavailable";
        break;
    }

    loggerHelpers.error(new Error(errorMessage), {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    throw new OpenFoodFactsError(errorMessage, response.status);
  }

  private async handleRequestError(error: unknown, url: string): Promise<FoodProductResult[]> {
    if (error instanceof OpenFoodFactsError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      logger.warn({ url }, "Request timed out");
      throw new OpenFoodFactsTimeoutError(REQUEST_TIMEOUT);
    }

    // Retry logic for network errors
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      const delayMs = Math.pow(2, this.retryCount) * 1000; // Exponential backoff

      logger.warn(
        { error: error instanceof Error ? error.message : error, retryCount: this.retryCount },
        `Network error, retrying in ${delayMs}ms`
      );

      await delay(delayMs);
      return this.makeRequest(url);
    }

    const errorMessage = "Failed to fetch from OpenFoodFacts API";
    loggerHelpers.error(
      new Error(errorMessage),
      {
        error: error instanceof Error ?
          { message: error.message, stack: error.stack, name: error.name } :
          error,
        url,
        retryCount: this.retryCount,
      }
    );

    return []; // Return empty array instead of throwing to maintain backwards compatibility
  }
}
