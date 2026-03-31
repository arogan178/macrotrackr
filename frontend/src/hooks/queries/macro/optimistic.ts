import { type QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type { MacroDailyTotals } from "@/types/macro";

import { getMacroHistorySnapshots, restoreMacroHistorySnapshots } from "./helpers";

export async function prepareOptimisticUpdate(
  queryClient: QueryClient,
  entryDate?: string
) {
  await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });

  const previousHistoryData = getMacroHistorySnapshots(queryClient);
  let previousDailyTotals: MacroDailyTotals | undefined;
  
  if (entryDate) {
    previousDailyTotals = queryClient.getQueryData<MacroDailyTotals>(
      queryKeys.macros.dailyTotals(entryDate)
    );
  }

  return { previousHistoryData, previousDailyTotals, entryDate };
}

export function rollbackOptimisticUpdate(
  queryClient: QueryClient,
  context: { previousHistoryData?: any; previousDailyTotals?: any; entryDate?: string } | undefined
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
