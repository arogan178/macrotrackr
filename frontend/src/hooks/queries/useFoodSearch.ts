import { useQuery } from "@tanstack/react-query";

import { type FoodSearchResult, macrosApi } from "@/api/macros";
import { queryKeys } from "@/lib/queryKeys";

export function useFoodSearch(query?: string) {
  const normalizedQuery = query?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.macros.search(normalizedQuery),
    queryFn: async (): Promise<FoodSearchResult[]> => {
      return macrosApi.search({ query: normalizedQuery });
    },
    enabled: normalizedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
