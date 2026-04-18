import { type QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type { MacroDailyTotals } from "@/types/macro";

import {
  getMacroHistorySnapshots,
  type MacroHistorySnapshot,
  restoreMacroHistorySnapshots,
} from "./helpers";

export interface MacroOptimisticContext {
  previousHistoryData?: MacroHistorySnapshot;
  previousDailyTotals?: MacroDailyTotals;
  entryDate?: string;
}

export async function prepareOptimisticUpdate(
  queryClient: QueryClient,
  entryDate?: string,
): Promise<MacroOptimisticContext> {
  await queryClient.cancelQueries({ queryKey: ["macros", "history-infinite"] });

  if (!entryDate) {
    return {
      previousHistoryData: getMacroHistorySnapshots(queryClient),
    };
  }

  await queryClient.cancelQueries({ queryKey: queryKeys.macros.dailyTotals(entryDate) });

  return captureMacroHistorySnapshot(queryClient, entryDate);
}

export function captureMacroHistorySnapshot(
  queryClient: QueryClient,
  entryDate: string,
): MacroOptimisticContext {
  const previousHistoryData = getMacroHistorySnapshots(queryClient);

  const previousDailyTotals = queryClient.getQueryData<MacroDailyTotals>(
    queryKeys.macros.dailyTotals(entryDate),
  );

  return { previousHistoryData, previousDailyTotals, entryDate };
}

export function rollbackOptimisticUpdate(
  queryClient: QueryClient,
  context: MacroOptimisticContext | undefined,
) {
  if (!context) {
    return;
  }

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
