// ponytail: metric-canonical state; UI converts display values when imperial is selected

export type UnitSystem = "metric" | "imperial";

export const LBS_PER_KG = 2.20462;
export const CM_PER_INCH = 2.54;

export function kgToLb(kg: number): number {
  return kg > 0 ? Math.round(kg * LBS_PER_KG * 10) / 10 : 0;
}

export function lbToKg(lb: number): number {
  return lb > 0 ? Math.round((lb / LBS_PER_KG) * 10) / 10 : 0;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  if (!cm || cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = Math.round(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number): number {
  const safeFeet = Math.max(0, feet || 0);
  const safeInches = Math.max(0, inches || 0);
  const totalInches = safeFeet * 12 + safeInches;

  return Math.round(totalInches * CM_PER_INCH);
}
