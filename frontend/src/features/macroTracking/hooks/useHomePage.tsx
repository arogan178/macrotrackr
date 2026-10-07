import { useCallback, useMemo } from "react";
import { FREE_TIER_LIMITS } from "@shared/entitlements";
import { useSearch } from "@tanstack/react-router";
import { parseISO } from "date-fns";

import { recentEntriesStart } from "@/hooks/queries/macro/entryStore";
import {
  useMacroHistoryInfinite,
  useRecentMacroEntries,
} from "@/hooks/queries/useMacroQueries";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { MacroEntry } from "@/types/macro";
import {
  addDaysISO,
  getDisplayDate,
  isValidDateString,
  todayISO,
} from "@/utils/dateUtilities";
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
  hasLoggedBefore = true,
  date?: string,
) {
  const title = useMemo(() => {
    const name = user?.firstName?.trim();

    if (isLoading) {
      return "Today";
    }

    if (!hasLoggedBefore) {
      return name ? `Let's log your first meal, ${name}` : "Log your first meal";
    }

    return name ? `Welcome back, ${name}` : "Today";
  }, [isLoading, user?.firstName, hasLoggedBefore]);

  const subtitle = useMemo(
    () => getDisplayDate(date ? parseISO(date) : new Date()),
    [date],
  );

  return { title, subtitle };
}

/** Invalid, future and (for free accounts) locked days fall back to today. */
export function resolveHomeDate(
  requested: string | undefined,
  today: string,
  oldestDate: string | undefined,
): string {
  if (!requested || !isValidDateString(requested) || requested > today) {
    return today;
  }
  if (oldestDate && requested < oldestDate) return today;

  return requested;
}

/** The day Home shows, from `/home?date=YYYY-MM-DD`. */
export function useHomeDate() {
  const search = (useSearch({ strict: false }) ?? {}) as { date?: string };
  const { hasProAccess } = useEntitlements();
  const today = todayISO();
  // Same cutoff as the history endpoint, so Home never opens a day it hides.
  const oldestDate = hasProAccess
    ? undefined
    : addDaysISO(today, -FREE_TIER_LIMITS.FREE_VISIBLE_HISTORY_DAYS);
  const date = resolveHomeDate(search.date, today, oldestDate);

  return { date, today, oldestDate, isToday: date === today };
}

/** Recent days come from the device; older ones page in from the server. */
export function useHistoryPagination(pageSize: number) {
  const { entries: recent, isLoading: isHistoryLoading } = useRecentMacroEntries();
  const {
    data: olderHistoryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMacroHistoryInfinite(pageSize, {
    endDate: addDaysISO(recentEntriesStart(), -1),
  });

  const history = useMemo(() => {
    const pages = olderHistoryData?.pages ?? [];
    const older = pages
      .flatMap((page) => (Array.isArray(page.entries) ? page.entries : []))
      .filter((entry) => isMacroEntry(entry));

    return [...recent, ...older];
  }, [recent, olderHistoryData]);

  // The older pages carry the free plan's hidden-entry count.
  const limits = olderHistoryData?.pages[0]?.limits;

  const loadMoreHistory = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  return {
    history,
    historyHasMore: hasNextPage,
    isHistoryLoading,
    isLoadingMore: isFetchingNextPage,
    loadMoreHistory,
    limits,
  };
}
