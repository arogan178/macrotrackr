/**
 * NumberField reports `undefined` while a field is empty, so every calculator
 * input goes through here. Storing 0 keeps the field visually empty (the fields
 * render `value || ""`) while guaranteeing the maths never sees NaN.
 */
export function toNumericInput(
  value: number | undefined,
  max?: number,
): number {
  if (value === undefined || Number.isNaN(value)) return 0;

  const positive = Math.max(0, value);

  return max === undefined ? positive : Math.min(max, positive);
}

export interface BodyStats {
  weightKg: number;
  heightCm: number;
  age: number;
}

/** True once every stat the formulas need has a usable value. */
export function hasValidBodyStats({
  weightKg,
  heightCm,
  age,
}: BodyStats): boolean {
  return weightKg > 0 && heightCm > 0 && age > 0;
}

export const INCOMPLETE_STATS_HINT =
  "Add your age, weight, and height to see your result.";
