import { type InfiniteData, type QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type { MacroEntry, PaginatedMacroHistory } from "@/types/macro";

export type MacroHistoryInfiniteData = InfiniteData<PaginatedMacroHistory, number>;
export type MacroHistorySnapshot = Array<
  readonly [ReadonlyArray<unknown>, MacroHistoryInfiniteData | undefined]
>;
export type OptimisticMacroEntry = MacroEntry & { optimistic?: boolean };

export function getMacroHistorySnapshots(queryClient: QueryClient) {
  return queryClient.getQueriesData<MacroHistoryInfiniteData>({
    queryKey: queryKeys.macros.historyInfinite(),
  });
}

export function restoreMacroHistorySnapshots(
  queryClient: QueryClient,
  snapshots: MacroHistorySnapshot,
) {
  for (const [queryKey, data] of snapshots) {
    if (data === undefined) {
      queryClient.removeQueries({ queryKey, exact: true });
      continue;
    }
    queryClient.setQueryData(queryKey, data);
  }
}

export function updateMacroHistoryCaches(
  queryClient: QueryClient,
  updater: (oldData: MacroHistoryInfiniteData | undefined) => MacroHistoryInfiniteData | undefined,
) {
  queryClient.setQueriesData<MacroHistoryInfiniteData>(
    { queryKey: queryKeys.macros.historyInfinite() },
    updater,
  );
}

export function normalizePaginatedHistory(
  response: unknown,
  limit: number,
  offset: number,
): PaginatedMacroHistory {
  if (!response || typeof response !== "object") {
    return { entries: [], total: 0, limit, offset, hasMore: false };
  }

  const result = response as Record<string, unknown>;

  return {
    entries: Array.isArray(result.entries) ? (result.entries as MacroEntry[]) : [],
    total: typeof result.total === "number" ? result.total : 0,
    limit: typeof result.limit === "number" ? result.limit : limit,
    offset: typeof result.offset === "number" ? result.offset : offset,
    hasMore: typeof result.hasMore === "boolean" ? result.hasMore : false,
    limits:
      result.limits && typeof result.limits === "object"
        ? (result.limits as PaginatedMacroHistory["limits"])
        : undefined,
  };
}
