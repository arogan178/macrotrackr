import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryConfigs } from "@/lib/queryClient";
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
    ...queryConfigs.macros, // 2 minutes stale time for macro data
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
    ...queryConfigs.macros, // 2 minutes stale time for macro data
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
    ...queryConfigs.longLived, // 5 minutes stale time for reporting data
    gcTime: 15 * 60 * 1000, // 15 minutes for longer cache retention
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
    ...queryConfigs.macros, // 2 minutes stale time for macro data
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
    ...queryConfigs.longLived, // 5 minutes stale time for targets (less frequently changed)
    gcTime: 30 * 60 * 1000, // Keep longer cache time for targets
  });
}
// Mutation hook for adding macro entry with optimistic updates
export function useAddMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: MacroEntryCreatePayload) => {
      return await apiService.macros.addEntry(entry);
    },
    onMutate: async (variables: MacroEntryCreatePayload) => {
      // Cancel any outgoing refetches for affected queries
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });
      await queryClient.cancelQueries({
        queryKey: queryKeys.macros.dailyTotals(variables.entryDate),
      });

      // Snapshot previous data
      const previousHistoryData = queryClient.getQueryData(
        queryKeys.macros.historyInfinite(),
      );
      const previousDailyTotals = queryClient.getQueryData(
        queryKeys.macros.dailyTotals(variables.entryDate),
      );

      // Create optimistic entry with temporary ID
      const optimisticEntry = {
        id: Date.now(), // Temporary ID
        ...variables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update infinite query data
      queryClient.setQueryData(
        queryKeys.macros.historyInfinite(),
        (oldData: any) => {
          if (!oldData) return oldData;

          const newPages = [...oldData.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              entries: [optimisticEntry, ...newPages[0].entries],
            };
          }

          return {
            ...oldData,
            pages: newPages,
          };
        },
      );

      // Optimistically update daily totals
      queryClient.setQueryData(
        queryKeys.macros.dailyTotals(variables.entryDate),
        (oldData: any) => {
          if (!oldData) {
            return {
              date: variables.entryDate,
              totalCalories: variables.calories,
              totalProtein: variables.protein,
              totalCarbs: variables.carbs,
              totalFat: variables.fat,
              entryCount: 1,
            };
          }

          return {
            ...oldData,
            totalCalories: oldData.totalCalories + variables.calories,
            totalProtein: oldData.totalProtein + variables.protein,
            totalCarbs: oldData.totalCarbs + variables.carbs,
            totalFat: oldData.totalFat + variables.fat,
            entryCount: oldData.entryCount + 1,
          };
        },
      );

      return { previousHistoryData, previousDailyTotals };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousHistoryData !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.historyInfinite(),
          context.previousHistoryData,
        );
      }
      if (context?.previousDailyTotals !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(variables.entryDate),
          context.previousDailyTotals,
        );
      }
      console.error("Error adding macro entry:", error);
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.all(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.dailyTotals(variables.entryDate),
      });
    },
  });
}

// Mutation hook for updating macro entry with optimistic updates
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
    onMutate: async ({ id, entry }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });

      // Find the entry date for daily totals invalidation
      let entryDate: string | null = null;
      const historyData = queryClient.getQueryData<any>(
        queryKeys.macros.historyInfinite(),
      );

      if (historyData?.pages) {
        for (const page of historyData.pages) {
          const foundEntry = page.entries?.find((e: any) => e.id === id);
          if (foundEntry) {
            entryDate = foundEntry.entryDate;
            break;
          }
        }
      }

      // Snapshot previous data
      const previousHistoryData = historyData;
      const previousDailyTotals = entryDate
        ? queryClient.getQueryData(queryKeys.macros.dailyTotals(entryDate))
        : null;

      // Optimistically update infinite query data
      queryClient.setQueryData(
        queryKeys.macros.historyInfinite(),
        (oldData: any) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page: any) => ({
            ...page,
            entries:
              page.entries?.map((e: any) =>
                e.id === id ? { ...e, ...entry } : e,
              ) || [],
          }));

          return {
            ...oldData,
            pages: newPages,
          };
        },
      );

      // Optimistically update daily totals if we found the entry date
      if (entryDate && previousDailyTotals) {
        // Find the original entry to calculate the difference
        const originalEntry = historyData?.pages
          ?.flatMap((page: any) => page.entries || [])
          ?.find((e: any) => e.id === id);

        if (originalEntry) {
          queryClient.setQueryData(
            queryKeys.macros.dailyTotals(entryDate),
            (oldData: any) => {
              if (!oldData) return oldData;

              const caloriesDiff =
                (entry.calories || originalEntry.calories) -
                originalEntry.calories;
              const proteinDiff =
                (entry.protein || originalEntry.protein) -
                originalEntry.protein;
              const carbsDiff =
                (entry.carbs || originalEntry.carbs) - originalEntry.carbs;
              const fatDiff =
                (entry.fat || originalEntry.fat) - originalEntry.fat;

              return {
                ...oldData,
                totalCalories: oldData.totalCalories + caloriesDiff,
                totalProtein: oldData.totalProtein + proteinDiff,
                totalCarbs: oldData.totalCarbs + carbsDiff,
                totalFat: oldData.totalFat + fatDiff,
              };
            },
          );
        }
      }

      return { previousHistoryData, previousDailyTotals, entryDate };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousHistoryData !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.historyInfinite(),
          context.previousHistoryData,
        );
      }
      if (context?.entryDate && context?.previousDailyTotals !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(context.entryDate),
          context.previousDailyTotals,
        );
      }
      console.error("Error updating macro entry:", error);
    },
    onSettled: (_data, _error, _variables, context) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.all(),
        exact: false,
      });
      if (context?.entryDate) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.macros.dailyTotals(context.entryDate),
        });
      }
    },
  });
}

// Mutation hook for deleting macro entry with optimistic updates
export function useDeleteMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await apiService.macros.deleteEntry(id);
    },
    onMutate: async (id: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });

      // Find the entry to delete and its date
      let entryToDelete: any = null;
      let entryDate: string | null = null;

      const historyData = queryClient.getQueryData<any>(
        queryKeys.macros.historyInfinite(),
      );

      if (historyData?.pages) {
        for (const page of historyData.pages) {
          const foundEntry = page.entries?.find((e: any) => e.id === id);
          if (foundEntry) {
            entryToDelete = foundEntry;
            entryDate = foundEntry.entryDate;
            break;
          }
        }
      }

      // Snapshot previous data
      const previousHistoryData = historyData;
      const previousDailyTotals = entryDate
        ? queryClient.getQueryData(queryKeys.macros.dailyTotals(entryDate))
        : null;

      // Optimistically remove from infinite query data
      queryClient.setQueryData(
        queryKeys.macros.historyInfinite(),
        (oldData: any) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page: any) => ({
            ...page,
            entries: page.entries?.filter((e: any) => e.id !== id) || [],
          }));

          return {
            ...oldData,
            pages: newPages,
          };
        },
      );

      // Optimistically update daily totals
      if (entryDate && entryToDelete && previousDailyTotals) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(entryDate),
          (oldData: any) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              totalCalories: Math.max(
                0,
                oldData.totalCalories - entryToDelete.calories,
              ),
              totalProtein: Math.max(
                0,
                oldData.totalProtein - entryToDelete.protein,
              ),
              totalCarbs: Math.max(0, oldData.totalCarbs - entryToDelete.carbs),
              totalFat: Math.max(0, oldData.totalFat - entryToDelete.fat),
              entryCount: Math.max(0, oldData.entryCount - 1),
            };
          },
        );
      }

      return { previousHistoryData, previousDailyTotals, entryDate };
    },
    onError: (error, _id, context) => {
      // Rollback optimistic updates
      if (context?.previousHistoryData !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.historyInfinite(),
          context.previousHistoryData,
        );
      }
      if (context?.entryDate && context?.previousDailyTotals !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(context.entryDate),
          context.previousDailyTotals,
        );
      }
      console.error("Error deleting macro entry:", error);
    },
    onSettled: (_data, _error, _id, context) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.all(),
        exact: false,
      });
      if (context?.entryDate) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.macros.dailyTotals(context.entryDate),
        });
      }
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
