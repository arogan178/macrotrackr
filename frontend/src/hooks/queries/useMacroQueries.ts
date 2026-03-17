import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { type MacroEntryCreatePayload, type MacroEntryUpdatePayload,macrosApi } from "@/api/macros";
import { calculateCaloriesFromMacros } from "@/features/macroTracking/calculations";
import { createMutationErrorLogger } from "@/lib/mutationErrorHandling";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type {
  MacroDailyTotals,
  MacroEntry,
  MacroTargetSettings,
  PaginatedMacroHistory,
} from "@/types/macro";
import { todayISO } from "@/utils/dateUtilities";

import {
  getMacroHistorySnapshots,
  normalizePaginatedHistory,
  type OptimisticMacroEntry,
  restoreMacroHistorySnapshots,
  updateMacroHistoryCaches,
} from "./macro/helpers";

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
      limit,
      options?.startDate,
      options?.endDate,
    ),
    queryFn: async () => {
      const response = await macrosApi.getHistory(
        limit,
        offset,
        options,
      );

      return normalizePaginatedHistory(response, limit, offset);
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
      limit,
      options?.startDate,
      options?.endDate,
    ),
    queryFn: async ({ pageParam: pageParameter = 0 }) => {
      const response = await macrosApi.getHistory(
        limit,
        pageParameter,
        options,
      );

      return normalizePaginatedHistory(response, limit, pageParameter);
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
      const response = await macrosApi.getAllHistory({
        startDate,
        endDate,
      });

      return response.entries;
    },
    ...queryConfigs.longLived,
    gcTime: 15 * 60 * 1000,
    enabled: !!(startDate && endDate),
    placeholderData: keepPreviousData,
  });
}

// Query hook for daily macro totals by date
export function useMacroDailyTotals(date?: string) {
  const today = todayISO();
  const queryDate = date ?? today;

  return useQuery({
    queryKey: queryKeys.macros.dailyTotals(queryDate),
    queryFn: async () => {
      const response = await macrosApi.getDailyTotals({
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
      const response = await macrosApi.getMacroTarget();

      return response?.macroTarget ?? null;
    },
    ...queryConfigs.longLived, // 5 minutes stale time for targets (less frequently changed)
    gcTime: 30 * 60 * 1000, // Keep longer cache time for targets
  });
}

// REFACTORED: Mutation hook for adding macro entry with seamless optimistic updates
export function useAddMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.macros.historyInfinite(), "add"],
    mutationFn: async (entry: MacroEntryCreatePayload) => {
      return (await macrosApi.addEntry(entry)) as MacroEntry;
    },
    onMutate: async (variables: MacroEntryCreatePayload) => {
      // 1. Cancel ongoing queries to prevent them from overwriting the optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.macros.historyInfinite(),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.macros.dailyTotals(variables.entryDate),
      });

      // 2. Snapshot the current state for potential rollback on error
      const previousHistoryData = getMacroHistorySnapshots(queryClient);
      const previousDailyTotals = queryClient.getQueryData<MacroDailyTotals>(
        queryKeys.macros.dailyTotals(variables.entryDate),
      );

      // 3. Create a temporary ID for the optimistic entry
      const temporaryId = -Date.now();
      const optimisticEntry: OptimisticMacroEntry = {
        id: temporaryId,
        createdAt: new Date().toISOString(),
        ...variables,
        mealName: variables.mealName ?? "",
        optimistic: true,
      };

      // 4. Optimistically update the history list in the cache
      updateMacroHistoryCaches(queryClient, (oldData) => {
        if (!oldData || oldData.pages.length === 0) {
          return oldData;
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) =>
            index === 0
              ? {
                  ...page,
                  entries: [optimisticEntry, ...page.entries],
                }
              : page,
          ),
          pageParams: oldData.pageParams,
        };
      });

      // 5. Optimistically update the daily totals in the cache
      queryClient.setQueryData(
        queryKeys.macros.dailyTotals(variables.entryDate),
        (oldData: MacroDailyTotals | undefined) => {
          const entryCalories = calculateCaloriesFromMacros(
            variables.protein,
            variables.carbs,
            variables.fats,
          );
          if (!oldData) {
            // Preserve object shape used by DailySummaryPanel to avoid flicker
            return {
              protein: variables.protein,
              carbs: variables.carbs,
              fats: variables.fats,
              calories: entryCalories,
            };
          }

          return {
            ...oldData,
            protein: oldData.protein + variables.protein,
            carbs: oldData.carbs + variables.carbs,
            fats: oldData.fats + variables.fats,
            calories: oldData.calories + entryCalories,
          };
        },
      );

      // 6. Return the context with snapshot data and the temporary ID
      return { previousHistoryData, previousDailyTotals, tempId: temporaryId };
    },
    onError: (_error, variables, context) => {
      // If there's an error, roll back the optimistic updates
      restoreMacroHistorySnapshots(queryClient, context?.previousHistoryData ?? []);
      if (context?.previousDailyTotals === undefined) {
        queryClient.removeQueries({
          queryKey: queryKeys.macros.dailyTotals(variables.entryDate),
        });
      } else {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(variables.entryDate),
          context.previousDailyTotals,
        );
      }
    },
    onSuccess: (newEntryFromServer: MacroEntry, variables, context) => {
      // 7. On success, replace the temporary entry with the real one from the server
      updateMacroHistoryCaches(queryClient, (oldData) => {
        if (!oldData) {
          return oldData;
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            entries: page.entries.map((entry) =>
              entry.id === context.tempId ? newEntryFromServer : entry,
            ),
          })),
        };
      });

      // Ensure totals reflect server response in case of server-side adjustments
      const entryDate = variables.entryDate;
      if (entryDate) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(entryDate),
          (oldData: MacroDailyTotals | undefined) => {
            if (!oldData) return oldData;
            const oldCalories = calculateCaloriesFromMacros(
              variables.protein,
              variables.carbs,
              variables.fats,
            );
            const newCalories = calculateCaloriesFromMacros(
              newEntryFromServer.protein,
              newEntryFromServer.carbs,
              newEntryFromServer.fats,
            );
            const caloriesDiff = newCalories - oldCalories;

            return {
              ...oldData,
              protein: oldData.protein - variables.protein + newEntryFromServer.protein,
              carbs: oldData.carbs - variables.carbs + newEntryFromServer.carbs,
              fats: oldData.fats - variables.fats + newEntryFromServer.fats,
              calories: oldData.calories + caloriesDiff,
            };
          },
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Light, targeted invalidations to avoid remounts but guarantee sync
      queryClient.invalidateQueries({
        queryKey: queryKeys.macros.dailyTotals(variables.entryDate),
      });
      // Do NOT invalidate historyInfinite broadly; optimistic replacement keeps UX smooth
    },
  });
}

// Mutation hook for updating macro entry with optimistic updates
export function useUpdateMacroEntry() {
  const queryClient = useQueryClient();
  const logUpdateMacroEntryError = createMutationErrorLogger(
    "Error updating macro entry",
  );

  return useMutation({
    mutationKey: [...queryKeys.macros.historyInfinite(), "update"],
    mutationFn: async ({
      id,
      entry,
    }: {
      id: number;
      entry: MacroEntryUpdatePayload;
    }) => {
      return await macrosApi.updateEntry(id, entry);
    },
    onMutate: async ({ id, entry }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });

      // Find the entry date for daily totals invalidation
      let entryDate: string | undefined;
      const previousHistoryData = getMacroHistorySnapshots(queryClient);
      const historyData = previousHistoryData.find(([, data]) => {
        return data?.pages.some((page) => page.entries.some((e) => e.id === id));
      })?.[1];

      if (historyData?.pages) {
        for (const page of historyData.pages) {
          const foundEntry = page.entries.find((e) => e.id === id);
          if (foundEntry) {
            entryDate = foundEntry.entryDate;
            break;
          }
        }
      }

      // Snapshot previous data
      const previousDailyTotals = entryDate
        ? queryClient.getQueryData(queryKeys.macros.dailyTotals(entryDate))
        : undefined;

      // Optimistically update infinite query data
      updateMacroHistoryCaches(queryClient, (oldData) => {
        if (!oldData) {
          return oldData;
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            entries: page.entries.map((entryItem) =>
              entryItem.id === id ? { ...entryItem, ...entry } : entryItem,
            ),
          })),
        };
      });

      // Optimistically update daily totals if we found the entry date
      if (entryDate && previousDailyTotals) {
        // Find the original entry to calculate the difference
        const originalEntry = historyData?.pages
          .flatMap((page) => page.entries)
          .find((entryItem) => entryItem.id === id);

        if (originalEntry) {
          queryClient.setQueryData(
            queryKeys.macros.dailyTotals(entryDate),
            (oldData: MacroDailyTotals | undefined) => {
              if (!oldData) return oldData;

              // Calculate calories diff using calculateCaloriesFromMacros
              const newCalories = calculateCaloriesFromMacros(
                entry.protein ?? originalEntry.protein,
                entry.carbs ?? originalEntry.carbs,
                entry.fats ?? originalEntry.fats,
              );
              const oldCalories = calculateCaloriesFromMacros(
                originalEntry.protein,
                originalEntry.carbs,
                originalEntry.fats,
              );
              const caloriesDiff = newCalories - oldCalories;
              const proteinDiff =
                (entry.protein ?? originalEntry.protein) -
                originalEntry.protein;
              const carbsDiff =
                (entry.carbs ?? originalEntry.carbs) - originalEntry.carbs;
              const fatsDiff =
                (entry.fats ?? originalEntry.fats) - originalEntry.fats;

              return {
                ...oldData,
                calories: oldData.calories + caloriesDiff,
                protein: oldData.protein + proteinDiff,
                carbs: oldData.carbs + carbsDiff,
                fats: oldData.fats + fatsDiff,
              };
            },
          );
        }
      }

      return { previousHistoryData, previousDailyTotals, entryDate };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      restoreMacroHistorySnapshots(queryClient, context?.previousHistoryData ?? []);
      if (context?.entryDate && context.previousDailyTotals !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(context.entryDate),
          context.previousDailyTotals,
        );
      }
      logUpdateMacroEntryError(error);
    },
    onSettled: (_data, _error, _variables, context) => {
      // Only invalidate queries if the mutation affects the currently displayed data
      if (context?.entryDate) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.macros.dailyTotals(context.entryDate),
        });
      }
      // Avoid broad invalidation of all macro queries to prevent remounts
    },
  });
}

// Mutation hook for deleting macro entry with optimistic updates
export function useDeleteMacroEntry() {
  const queryClient = useQueryClient();
  const logDeleteMacroEntryError = createMutationErrorLogger(
    "Error deleting macro entry",
  );

  return useMutation({
    mutationKey: [...queryKeys.macros.historyInfinite(), "delete"],
    mutationFn: async (id: number) => {
      return await macrosApi.deleteEntry(id);
    },
    onMutate: async (id: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });

      // Find the entry to delete and its date
      let entryToDelete: PaginatedMacroHistory["entries"][number] | undefined;
      let entryDate: string | undefined;

      const previousHistoryData = getMacroHistorySnapshots(queryClient);
      const historyData = previousHistoryData.find(([, data]) => {
        return data?.pages.some((page) => page.entries.some((entry) => entry.id === id));
      })?.[1];

      if (historyData?.pages) {
        for (const page of historyData.pages) {
          const foundEntry = page.entries.find((entryItem) => entryItem.id === id);
          if (foundEntry) {
            entryToDelete = foundEntry;
            entryDate = foundEntry.entryDate;
            break;
          }
        }
      }

      // Snapshot previous data
      const previousDailyTotals = entryDate
        ? queryClient.getQueryData(queryKeys.macros.dailyTotals(entryDate))
        : undefined;

      // Optimistically remove from infinite query data
      updateMacroHistoryCaches(queryClient, (oldData) => {
        if (!oldData) {
          return oldData;
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            entries: page.entries.filter((entryItem) => entryItem.id !== id),
          })),
        };
      });

      // Optimistically update daily totals
      if (entryDate && entryToDelete && previousDailyTotals) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(entryDate),
          (oldData: MacroDailyTotals | undefined) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              calories: Math.max(
                0,
                oldData.calories -
                  calculateCaloriesFromMacros(
                    entryToDelete.protein,
                    entryToDelete.carbs,
                    entryToDelete.fats,
                  ),
              ),
              protein: Math.max(
                0,
                oldData.protein - entryToDelete.protein,
              ),
              carbs: Math.max(0, oldData.carbs - entryToDelete.carbs),
              fats: Math.max(0, oldData.fats - entryToDelete.fats),
            };
          },
        );
      }

      return { previousHistoryData, previousDailyTotals, entryDate };
    },
    onError: (error, _id, context) => {
      // Rollback optimistic updates
      restoreMacroHistorySnapshots(queryClient, context?.previousHistoryData ?? []);
      if (context?.entryDate && context.previousDailyTotals !== undefined) {
        queryClient.setQueryData(
          queryKeys.macros.dailyTotals(context.entryDate),
          context.previousDailyTotals,
        );
      }
      logDeleteMacroEntryError(error);
    },
    onSettled: (_data, _error, _id, context) => {
      // Only invalidate queries if the mutation affects the currently displayed data
      if (context?.entryDate) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.macros.dailyTotals(context.entryDate),
        });
      }
      // Avoid broad invalidation of all macro queries to prevent remounts
    },
  });
}

// Mutation hook for updating macro target with cache invalidation
export function useUpdateMacroTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.macros.targets(), "update"],
    mutationFn: async (settings: MacroTargetSettings) => {
      return await macrosApi.saveMacroTargetPercentages({
        macroTarget: settings,
      });
    },
    onSuccess: () => {
      // Invalidate macro targets query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.targets() });
    },
  });
}
