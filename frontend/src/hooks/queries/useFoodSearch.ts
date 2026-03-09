import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type { FoodSearchResult } from "@/utils/apiServices";
import { apiService } from "@/utils/apiServices";

export function useFoodSearch(query?: string) {
  const normalizedQuery = query?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.macros.search(normalizedQuery),
    queryFn: async (): Promise<FoodSearchResult[]> => {
      return apiService.macros.search(normalizedQuery);
    },
    enabled: normalizedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}