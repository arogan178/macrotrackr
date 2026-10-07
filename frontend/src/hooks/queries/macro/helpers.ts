import type { MacroEntry, PaginatedMacroHistory } from "@/types/macro";

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
