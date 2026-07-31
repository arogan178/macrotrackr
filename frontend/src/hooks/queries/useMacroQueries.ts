import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  type MacroEntryCreatePayload,
  type MacroEntryUpdatePayload,
  macrosApi,
} from "@/api/macros";
import { calculateCaloriesFromMacros } from "@/features/macroTracking/calculations";
import { broadcastLocalDataChange } from "@/hooks/useRealtimeSync";
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
  updateMacroHistoryCaches,
} from "./macro/helpers";
import { prepareOptimisticUpdate, rollbackOptimisticUpdate } from "./macro/optimistic";

// --- Helpers ---

function findEntryInHistory(queryClient: QueryClient, id: number) {
  const previousHistoryData = getMacroHistorySnapshots(queryClient);
  const historyData = previousHistoryData.find(([, data]) => {
    return data?.pages.some((page) =>
      page.entries.some((entry) => Number(entry.id) === Number(id)),
    );
  })?.[1];

  if (historyData?.pages) {
    for (const page of historyData.pages) {
      const foundEntry = page.entries.find(
        (entry) => Number(entry.id) === Number(id),
      );
      if (foundEntry) {
        return { entry: foundEntry, entryDate: foundEntry.entryDate };
      }
    }
  }

  return { entry: undefined, entryDate: undefined };
}

function adjustDailyTotals(
  queryClient: QueryClient,
  date: string,
  adjustments: { protein: number; carbs: number; fats: number; calories?: number },
  isAdd = false
) {
  queryClient.setQueryData(
    queryKeys.macros.dailyTotals(date),
    (oldData: MacroDailyTotals | undefined) => {
      const caloriesDiff = adjustments.calories ?? calculateCaloriesFromMacros(
        adjustments.protein,
        adjustments.carbs,
        adjustments.fats,
      );

      if (!oldData) {
        if (!isAdd) return oldData;

        return {
          protein: Math.max(0, adjustments.protein),
          carbs: Math.max(0, adjustments.carbs),
          fats: Math.max(0, adjustments.fats),
          calories: Math.max(0, caloriesDiff),
        };
      }

      return {
        ...oldData,
        protein: Math.max(0, oldData.protein + adjustments.protein),
        carbs: Math.max(0, oldData.carbs + adjustments.carbs),
        fats: Math.max(0, oldData.fats + adjustments.fats),
        calories: Math.max(0, oldData.calories + caloriesDiff),
      };
    },
  );
}

function transformHistoryPages(
  queryClient: QueryClient,
  pageTransformer: (page: PaginatedMacroHistory, index: number) => PaginatedMacroHistory
) {
  const snapshots = getMacroHistorySnapshots(queryClient);

  if (snapshots.length === 0) {
    queryClient.setQueryData(
      queryKeys.macros.historyInfinite(20),
      {
        pages: [
          pageTransformer(
            { entries: [], total: 0, limit: 20, offset: 0, hasMore: false },
            0,
          ),
        ],
        pageParams: [0],
      },
    );

    return;
  }

  updateMacroHistoryCaches(queryClient, (oldData) => {
    if (!oldData || oldData.pages.length === 0) {
      return oldData;
    }

    return {
      ...oldData,
      pages: oldData.pages.map(pageTransformer),
      pageParams: oldData.pageParams,
    };
  });
}

// --- Queries ---

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
        { limit, offset, ...options },
      );

      return normalizePaginatedHistory(response, limit, offset);
    },
    ...queryConfigs.macros, // 2 minutes stale time for macro data
  });
}

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
        { limit, offset: pageParameter, ...options },
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

export function useMacroTargetQuery() {
  return useQuery({
    queryKey: queryKeys.macros.targets(),
    queryFn: async () => {
      const response = await macrosApi.getMacroTarget();

      return response?.macroTarget ?? null;
    },
    ...queryConfigs.longLived,
    gcTime: 30 * 60 * 1000,
  });
}

// --- Mutations ---

export function useAddMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.macros.historyInfinite(), "add"],
    mutationFn: async (entry: MacroEntryCreatePayload) => {
      return (await macrosApi.addEntry(entry)) as MacroEntry;
    },
    onMutate: async (variables: MacroEntryCreatePayload) => {
      const contextPromise = prepareOptimisticUpdate(
        queryClient,
        variables.entryDate,
      );

      const temporaryId = -Date.now();
      const clientId = `client_${temporaryId}_${Math.random().toString(36).substring(2, 7)}`;
      const proteinNumber = Number(variables.protein ?? 0);
      const carbsNumber = Number(variables.carbs ?? 0);
      const fatsNumber = Number(variables.fats ?? 0);

      const optimisticEntry: OptimisticMacroEntry = {
        id: temporaryId,
        clientId,
        createdAt: new Date().toISOString(),
        ...variables,
        protein: proteinNumber,
        carbs: carbsNumber,
        fats: fatsNumber,
        mealName: variables.mealName ?? "",
        optimistic: true,
      };

      transformHistoryPages(queryClient, (page, index) =>
        index === 0
          ? { ...page, entries: [optimisticEntry, ...page.entries] }
          : page,
      );

      if (variables.entryDate) {
        adjustDailyTotals(
          queryClient,
          variables.entryDate,
          { protein: proteinNumber, carbs: carbsNumber, fats: fatsNumber },
          true,
        );
      }

      const context = await contextPromise;

      return { ...context, tempId: temporaryId, clientId };
    },
    onError: (_error, _variables, context) => rollbackOptimisticUpdate(queryClient, context),
    onSuccess: (newEntryFromServer: MacroEntry, variables, context) => {
      transformHistoryPages(queryClient, (page) => ({
        ...page,
        entries: page.entries.map((entry) =>
          entry.id === context.tempId
            ? { ...newEntryFromServer, clientId: entry.clientId ?? context.clientId }
            : entry,
        ),
      }));

      if (variables.entryDate) {
        const oldCalories = calculateCaloriesFromMacros(variables.protein, variables.carbs, variables.fats);
        const newCalories = calculateCaloriesFromMacros(newEntryFromServer.protein, newEntryFromServer.carbs, newEntryFromServer.fats);
        
        adjustDailyTotals(queryClient, variables.entryDate, {
          protein: newEntryFromServer.protein - variables.protein,
          carbs: newEntryFromServer.carbs - variables.carbs,
          fats: newEntryFromServer.fats - variables.fats,
          calories: newCalories - oldCalories,
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      if (variables.entryDate) {
        queryClient.invalidateQueries({ queryKey: queryKeys.macros.dailyTotals(variables.entryDate) });
      }
      queryClient.invalidateQueries({
        queryKey: ["macros", "history-infinite"],
        refetchType: "none",
      });
      broadcastLocalDataChange("macros");
    },
  });
}

export function useUpdateMacroEntry() {
  const queryClient = useQueryClient();
  const logUpdateMacroEntryError = createMutationErrorLogger("Error updating macro entry");

  return useMutation({
    mutationKey: [...queryKeys.macros.historyInfinite(), "update"],
    mutationFn: async ({ id, entry }: { id: number; entry: MacroEntryUpdatePayload }) => {
      return await macrosApi.updateEntry(id, entry);
    },
    onMutate: async ({ id, entry }) => {
      const { entry: originalEntry, entryDate } = findEntryInHistory(
        queryClient,
        id,
      );

      const contextPromise = prepareOptimisticUpdate(queryClient, entryDate);

      transformHistoryPages(queryClient, (page) => ({
        ...page,
        entries: page.entries.map((entryItem) =>
          Number(entryItem.id) === Number(id)
            ? {
                ...entryItem,
                ...entry,
                protein:
                  entry.protein !== undefined
                    ? Number(entry.protein)
                    : entryItem.protein,
                carbs:
                  entry.carbs !== undefined
                    ? Number(entry.carbs)
                    : entryItem.carbs,
                fats:
                  entry.fats !== undefined
                    ? Number(entry.fats)
                    : entryItem.fats,
              }
            : entryItem,
        ),
      }));

      if (entryDate && originalEntry) {
        const newProtein =
          entry.protein !== undefined
            ? Number(entry.protein)
            : originalEntry.protein;
        const newCarbs =
          entry.carbs !== undefined
            ? Number(entry.carbs)
            : originalEntry.carbs;
        const newFats =
          entry.fats !== undefined ? Number(entry.fats) : originalEntry.fats;

        const newCalories = calculateCaloriesFromMacros(
          newProtein,
          newCarbs,
          newFats,
        );
        const oldCalories = calculateCaloriesFromMacros(
          originalEntry.protein,
          originalEntry.carbs,
          originalEntry.fats,
        );

        adjustDailyTotals(queryClient, entryDate, {
          protein: newProtein - originalEntry.protein,
          carbs: newCarbs - originalEntry.carbs,
          fats: newFats - originalEntry.fats,
          calories: newCalories - oldCalories,
        });
      }

      const context = await contextPromise;

      return context;
    },
    onError: (error, _variables, context) => {
      rollbackOptimisticUpdate(queryClient, context);
      logUpdateMacroEntryError(error);
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.entryDate) {
        queryClient.invalidateQueries({ queryKey: queryKeys.macros.dailyTotals(context.entryDate) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });
      broadcastLocalDataChange("macros");
    },
  });
}

export function useDeleteMacroEntry() {
  const queryClient = useQueryClient();
  const logDeleteMacroEntryError = createMutationErrorLogger("Error deleting macro entry");

  return useMutation({
    mutationKey: [...queryKeys.macros.historyInfinite(), "delete"],
    mutationFn: async (id: number) => {
      return await macrosApi.deleteEntry(id);
    },
    onMutate: async (id: number) => {
      const { entry: entryToDelete, entryDate } = findEntryInHistory(
        queryClient,
        id,
      );

      const contextPromise = prepareOptimisticUpdate(queryClient, entryDate);

      transformHistoryPages(queryClient, (page) => ({
        ...page,
        entries: page.entries.filter(
          (entryItem) => Number(entryItem.id) !== Number(id),
        ),
      }));

      if (entryDate && entryToDelete) {
        adjustDailyTotals(queryClient, entryDate, {
          protein: -entryToDelete.protein,
          carbs: -entryToDelete.carbs,
          fats: -entryToDelete.fats,
        });
      }

      const context = await contextPromise;

      return context;
    },
    onError: (error, _id, context) => {
      rollbackOptimisticUpdate(queryClient, context);
      logDeleteMacroEntryError(error);
    },
    onSettled: (_data, _error, _id, context) => {
      if (context?.entryDate) {
        queryClient.invalidateQueries({ queryKey: queryKeys.macros.dailyTotals(context.entryDate) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });
      broadcastLocalDataChange("macros");
    },
  });
}

export function useUpdateMacroTarget() {
  const queryClient = useQueryClient();
  const logUpdateMacroTargetError = createMutationErrorLogger(
    "Error updating macro target",
  );

  return useMutation({
    mutationKey: [...queryKeys.macros.targets(), "update"],
    mutationFn: async (settings: MacroTargetSettings) => {
      return await macrosApi.saveMacroTargetPercentages({
        macroTarget: settings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.targets() });
      broadcastLocalDataChange("macros");
    },
    onError: logUpdateMacroTargetError,
  });
}
