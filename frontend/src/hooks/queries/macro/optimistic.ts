import { type QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type { MacroDailyTotals } from "@/types/macro";
import { getMacroHistorySnapshots, restoreMacroHistorySnapshots, type MacroHistorySnapshot } from "./helpers";

export interface MacroOptimisticContext {
  previousHistoryData?: MacroHistorySnapshot;
  previousDailyTotals?: MacroDailyTotals;
  entryDate?: string;
}

export function captureMacroHistorySnapshot(
  queryClient: QueryClient,
  entryDate: string
): MacroOptimisticContext {
  const previousHistoryData = getMacroHistorySnapshots(queryClient);

  let previousDailyTotals: MacroDailyTotals | undefined;
  try {
    previousDailyTotals = queryClient.getQueryData<MacroDailyTotals>(
      queryKeys.macros.dailyTotals(entryDate)
    );
  } catch {
  }

  return { previousHistoryData, previousDailyTotals, entryDate };
}

export function rollbackOptimisticUpdate(
  queryClient: QueryClient,
  context: MacroOptimisticContext | undefined
) {
  if (!context) return;
  
  restoreMacroHistorySnapshots(queryClient, context.previousHistoryData ?? []);
  
  if (context.entryDate) {
    if (context.previousDailyTotals === undefined) {
      queryClient.removeQueries({
        queryKey: queryKeys.macros.dailyTotals(context.entryDate),
      });
    } else {
      queryClient.setQueryData(
        queryKeys.macros.dailyTotals(context.entryDate),
        context.previousDailyTotals
      );
    }
  }
}
