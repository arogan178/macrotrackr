import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type {
  MacroDailyTotals,
  MacroEntry,
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
  return useQuery({
    queryKey: queryKeys.macros.history(Math.floor(offset / limit) + 1),
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
    onSuccess: (data, variables) => {
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
