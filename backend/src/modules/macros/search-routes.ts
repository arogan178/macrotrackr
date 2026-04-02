import { BadRequestError } from "../../lib/errors";
import {
  buildFoodSearchCacheKey,
  normalizeFoodSearchQuery,
} from "../../lib/openfoodfacts-api-client";
import type { FoodProductResult } from "../../lib/openfoodfacts-api-client";
import { MacroSchemas } from "./schemas";
import type { MacrosRouteContext } from "./service";

export const registerMacroSearchRoutes = (group: any) =>
  group.get(
    "/search",
    async (context: any) => {
      const { query, openFoodFactsApiClient, cacheService: cache } =
        context as MacrosRouteContext;

      const rawSearchQuery = query?.q;
      if (!rawSearchQuery) {
        throw new BadRequestError("Search query is required");
      }

      const searchQuery = normalizeFoodSearchQuery(rawSearchQuery);
      if (searchQuery.length < 2) {
        throw new BadRequestError(
          "Search query must be at least 2 characters long",
        );
      }

      const cacheKey = buildFoodSearchCacheKey(searchQuery);
      if (cache) {
        const cachedResult = cache.get<FoodProductResult[]>(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      if (!openFoodFactsApiClient) {
        throw new BadRequestError("Food API client not available");
      }

      const results = await openFoodFactsApiClient.search(searchQuery);
      if (cache) {
        cache.set(cacheKey, results);
      }

      return results;
    },
    {
      query: MacroSchemas.foodSearchQuery,
      response: MacroSchemas.foodSearchResponse,
      detail: {
        summary: "Search for a food item using OpenFoodFacts API",
        tags: ["Macros"],
      },
    },
  );
