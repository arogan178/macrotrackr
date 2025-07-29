import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type {
  MacroDailyTotals,
  MacroTargetSettings,
  PaginatedMacroHistory,
} from "@/types/macro";
import type {
  MacroEntryCreatePayload,
  MacroEntryUpdatePayload,
} from "@/utils/apiServices";
import { apiService } from "@/utils/apiServices";

// Query hook for paginated macro history
export function useMacroHistory(
  limit = 20,
  offset = 0,
  options?: { startDate?: string; endDate?: string },
) {
  const page = Math.floor(offset / limit) + 1;

  return useQuery({
    queryKey: queryKeys.macros.history(
      page,
      options?.startDate,
      options?.endDate,
    ),
    queryFn: async () => {
      const response = await apiService.macros.getHistory(
        limit,
        offset,
        options,
      );
      return response as PaginatedMacroHistory;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Infinite query hook for macro history with proper pagination
export function useMacroHistoryInfinite(
  limit = 20,
  options?: { startDate?: string; endDate?: string },
) {
  return useInfiniteQuery({
    queryKey: queryKeys.macros.historyInfinite(
      options?.startDate,
      options?.endDate,
    ),
    queryFn: async ({ pageParam: pageParameter = 0 }) => {
      const response = await apiService.macros.getHistory(
        limit,
        pageParameter,
        options,
      );
      return response as PaginatedMacroHistory;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return;
      return allPages.length * limit; // Calculate next offset
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Query hook for getting ALL macro entries within a date range (for reporting)
export function useMacroHistoryForDateRange(
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: queryKeys.macros.historyRange(startDate, endDate),
    queryFn: async () => {
      // Get a large number of entries to ensure we get all data for the date range
      const response = await apiService.macros.getHistory(10_000, 0, {
        startDate,
        endDate,
      });
      return (response as PaginatedMacroHistory).entries;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for reporting data
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!(startDate && endDate), // Only run if both dates are provided
  });
}

// Query hook for daily macro totals by date
export function useMacroDailyTotals(date?: string) {
  const today = new Date().toISOString().split("T")[0];
  const queryDate = date || today;

  return useQuery({
    queryKey: queryKeys.macros.dailyTotals(queryDate),
    queryFn: async () => {
      const response = await apiService.macros.getDailyTotals({
        startDate: queryDate,
        endDate: queryDate,
      });
      return response as MacroDailyTotals;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Query hook for macro targets
export function useMacroTarget() {
  return useQuery({
    queryKey: queryKeys.macros.targets(),
    queryFn: async () => {
      const response = await apiService.macros.getMacroTarget();
      return response?.macroTarget;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
// Mutation hook for adding macro entry with immediate invalidation
export function useAddMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: MacroEntryCreatePayload) => {
      return await apiService.macros.addEntry(entry);
    },
    onSuccess: (_data, variables) => {
      // Invalidate all macro history queries (all pages)
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.all(),
        exact: false,
      });
      // Also specifically invalidate daily totals
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.dailyTotals(variables.entryDate),
      });
    },
  });
}

// Mutation hook for updating macro entry with immediate invalidation
export function useUpdateMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      entry,
    }: {
      id: number;
      entry: MacroEntryUpdatePayload;
    }) => {
      return await apiService.macros.updateEntry(id, entry);
    },
    onSuccess: () => {
      // Invalidate all macro queries (all pages and daily totals)
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.all(),
        exact: false,
      });
    },
  });
}

// Mutation hook for deleting macro entry with immediate invalidation
export function useDeleteMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await apiService.macros.deleteEntry(id);
    },
    onSuccess: () => {
      // Invalidate all macro queries (all pages and daily totals)
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.all(),
        exact: false,
      });
    },
  });
}

// Mutation hook for updating macro target with cache invalidation
export function useUpdateMacroTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: MacroTargetSettings) => {
      return await apiService.macros.saveMacroTargetPercentages({
        macroTarget: settings,
      });
    },
    onSuccess: () => {
      // Invalidate macro targets query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.targets() });
    },
  });
}
