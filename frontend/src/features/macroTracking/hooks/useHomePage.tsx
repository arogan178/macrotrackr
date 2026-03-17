import { useCallback, useMemo } from "react";

import { useMacroHistoryInfinite } from "@/hooks/queries/useMacroQueries";
import type { MacroEntry } from "@/types/macro";
import { getDisplayDate } from "@/utils/dateUtilities";
import {
  createNutritionProfile,
  type NutritionProfileSource,
} from "@/utils/userConstants";

function isMacroEntry(entry: unknown): entry is MacroEntry {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const candidate = entry as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.protein === "number" &&
    typeof candidate.carbs === "number" &&
    typeof candidate.fats === "number"
  );
}

export function useNutritionProfile(user: NutritionProfileSource | undefined) {
  return useMemo(() => {
    if (user && typeof user.id === "number") {
      return createNutritionProfile(user);
    }

    return undefined;
  }, [user]);
}

export function useHomeHeader(
  user: { firstName?: string } | undefined,
  isLoading: boolean,
) {
  const title = useMemo(() => {
    return `Welcome back, ${isLoading ? "..." : user?.firstName ?? "User"}`;
  }, [isLoading, user?.firstName]);

  const subtitle = useMemo(() => getDisplayDate(new Date()), []);

  return { title, subtitle };
}

export function useHistoryPagination(pageSize: number) {
  const {
    data: macroHistoryData,
    isLoading: isHistoryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMacroHistoryInfinite(pageSize);

  const history = useMemo(() => {
    const pages = macroHistoryData?.pages;
    if (!Array.isArray(pages)) {
      return [];
    }

    return pages
      .flatMap((page) => (Array.isArray(page.entries) ? page.entries : []))
      .filter((entry) => isMacroEntry(entry));
  }, [macroHistoryData]);

  // Get limits from the first page (all pages have same limits data)
  const limits = useMemo(() => {
    const firstPage = macroHistoryData?.pages?.[0];

    return firstPage!.limits;
  }, [macroHistoryData]);

  const historyHasMore = hasNextPage;
  const isLoadingMore = isFetchingNextPage;

  const loadMoreHistory = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  return {
    history,
    historyHasMore,
    isHistoryLoading,
    isLoadingMore,
    loadMoreHistory,
    limits,
  };
}
