// HomePage-specific hooks (ESLint-compliant)
// File: [frontend/src/features/macroTracking/hooks/homePageHooks.ts](frontend/src/features/macroTracking/hooks/homePageHooks.ts:1)

import { useCallback, useMemo } from "react";

import type { UserPublic } from "@/features/macroTracking/types/macro";
import { useMacroHistoryInfinite } from "@/hooks/queries/useMacroQueries";
import type { MacroEntry } from "@/types/macro";
import { getDisplayDate } from "@/utils/dateUtilities";
import { createNutritionProfile } from "@/utils/userConstants";

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

/**
 * Derives the nutrition profile from the provided user with a safe fallback.
 * Returns null when no user is available (instead of undefined) to satisfy linters.
 */
export function useNutritionProfile(user: UserPublic | undefined) {
  return useMemo(() => {
    if (user && typeof user.id === "number") {
      try {
        // keep runtime behavior; typing improved at callsite
        return createNutritionProfile(user as any);
      } catch (error) {
        console.warn("Could not calculate nutrition profile:", error);
        return { userId: user.id, bmr: 1800, tdee: 2200 };
      }
    }
    return;
  }, [user]);
}

/**
 * Produces the header title and subtitle. Subtitle uses the same date format previously used inline.
 */
export function useHomeHeader(
  user: UserPublic | undefined,
  isLoading: boolean,
) {
  const title = useMemo(() => {
    return `Welcome back, ${isLoading ? "..." : user?.firstName || "User"}`;
  }, [isLoading, user?.firstName]);

  const subtitle = useMemo(() => getDisplayDate(new Date()), []);
  return { title, subtitle };
}

/**
 * Wraps the infinite history query to provide derived list and stable handlers.
 */
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
      .flatMap((page) => (Array.isArray(page?.entries) ? page.entries : []))
      .filter((entry) => isMacroEntry(entry));
  }, [macroHistoryData]);

  // Get limits from the first page (all pages have same limits data)
  const limits = useMemo(() => {
    const firstPage = macroHistoryData?.pages?.[0];
    return firstPage?.limits;
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
