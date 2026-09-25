import type { MacroEntry } from "@/types/macro";

export interface FrequentFood {
  entry: MacroEntry;
  count: number;
}

/**
 * Ranks foods by how often their name appears in `entries`, which must be
 * newest-first. Ties go to the most recently logged, and each food is shown
 * as its latest entry so the macros reflect what the user logs now.
 */
export function rankFrequentFoods(
  entries: MacroEntry[],
  limit: number,
): FrequentFood[] {
  const byName = new Map<string, FrequentFood>();

  for (const entry of entries) {
    const key = (entry.foodName ?? entry.mealName)?.trim().toLowerCase();
    if (!key) continue;

    const food = byName.get(key);
    if (food) {
      food.count += 1;
    } else {
      byName.set(key, { entry, count: 1 });
    }
  }

  // Map keeps first-seen order and sort is stable, so equal counts stay newest-first.
  return [...byName.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
