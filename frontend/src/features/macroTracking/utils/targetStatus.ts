/**
 * One status code for every figure judged against a target, so a dot on the
 * week strip and a macro row mean the same thing: nothing yet, still to go,
 * on target, or over.
 */
export type TargetStatus = "empty" | "under" | "hit" | "over";

/** Within this share of a target either side counts as hitting it. */
export const TARGET_TOLERANCE = 0.1;

export function targetStatus(actual: number, target: number): TargetStatus {
  if (!(actual > 0)) return "empty";
  if (!(target > 0)) return "under";

  const ratio = actual / target;
  if (ratio > 1 + TARGET_TOLERANCE) return "over";
  if (ratio >= 1 - TARGET_TOLERANCE) return "hit";

  return "under";
}
