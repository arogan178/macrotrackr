import { BadRequestError } from "../../lib/http/errors";
import {
  buildFoodSearchCacheKey,
  normalizeFoodSearchQuery,
} from "../../services/openfoodfacts-api-client";
import type { FoodProductResult } from "../../services/openfoodfacts-api-client";
import { MacroSchemas } from "./schemas";
import type { MacrosRouteContext } from "./service";

type MacroRouteGroup = {
  get: (path: string, ...args: unknown[]) => MacroRouteGroup;
};

export const registerMacroSearchRoutes = (group: MacroRouteGroup) =>
  group.get(
    "/search",
    async (context: MacrosRouteContext) => {
      const { query, openFoodFactsApiClient, cacheService: cache } = context;

      const rawSearchQuery = query.q;
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
