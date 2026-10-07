import { useEffect, useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { macrosApi } from "@/api/macros";
import { calculateCaloriesFromMacros } from "@/features/macroTracking/calculations";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useIsOffline } from "@/hooks/useIsOffline";
import { broadcastLocalDataChange } from "@/hooks/useRealtimeSync";
import { createMutationErrorLogger } from "@/lib/mutationErrorHandling";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type {
  MacroDailyTotals,
  MacroEntry,
  MacroTargetSettings,
} from "@/types/macro";
import { todayISO } from "@/utils/dateUtilities";

import { getEntryStore, recentEntriesStart } from "./macro/entryStore";
import { normalizePaginatedHistory } from "./macro/helpers";

// --- Recent entries, kept on the device ---

/** The signed-in account's entries and offline write queue. */
export function useEntryStore() {
  const { data: user, dataUpdatedAt } = useUser();
  const store = user ? getEntryStore(user.id) : undefined;

  // A fresh profile read means the session works again, so held writes can go.
  useEffect(() => {
    store?.resumeAfterSignIn();
  }, [store, dataUpdatedAt]);

  return store;
}

function newestFirst(a: MacroEntry, b: MacroEntry): number {
  return (
    b.entryDate.localeCompare(a.entryDate) ||
    b.entryTime.localeCompare(a.entryTime) ||
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function useRecentMacroEntries() {
  const store = useEntryStore();
  const isOffline = useIsOffline();
  const { data, isReady } = useLiveQuery(() => store?.entries, [store]);
  const entries = useMemo(() => [...(data ?? [])].sort(newestFirst), [data]);

  // Offline with nothing on the device, the first load never finishes.
  return { entries, isLoading: !isReady && !isOffline };
}

function sumMacros(entries: MacroEntry[]): MacroDailyTotals {
  const totals = { protein: 0, carbs: 0, fats: 0 };
  for (const entry of entries) {
    totals.protein += entry.protein;
    totals.carbs += entry.carbs;
    totals.fats += entry.fats;
  }

  return {
    ...totals,
    calories: Math.round(calculateCaloriesFromMacros(totals.protein, totals.carbs, totals.fats)),
  };
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

/** Days on the device add up locally, so offline entries count straight away. */
export function useMacroDailyTotals(date?: string) {
  const queryDate = date ?? todayISO();
  const isRecent = queryDate >= recentEntriesStart();
  const { entries } = useRecentMacroEntries();

  const serverTotals = useQuery({
    queryKey: queryKeys.macros.dailyTotals(queryDate),
    queryFn: async () => {
      const response = await macrosApi.getDailyTotals({
        startDate: queryDate,
        endDate: queryDate,
      });

      return response as MacroDailyTotals;
    },
    ...queryConfigs.macros, // 2 minutes stale time for macro data
    enabled: !isRecent,
  });

  const recentTotals = useMemo(
    () => (isRecent ? sumMacros(entries.filter((entry) => entry.entryDate === queryDate)) : undefined),
    [isRecent, entries, queryDate],
  );

  return { data: isRecent ? recentTotals : serverTotals.data };
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

export function useImportMacros() {
  const queryClient = useQueryClient();
  const logImportError = createMutationErrorLogger("Error importing macro data");

  return useMutation({
    mutationKey: [...queryKeys.macros.all(), "import"],
    mutationFn: async (payload: Parameters<typeof macrosApi.importData>[0]) => {
      return await macrosApi.importData(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all() });
      queryClient.invalidateQueries({ queryKey: ["reporting"] });
      broadcastLocalDataChange("macros");
      broadcastLocalDataChange("goals");
    },
    onError: logImportError,
  });
}
