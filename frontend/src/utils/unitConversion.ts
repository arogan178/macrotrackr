// ponytail: metric-canonical state; UI converts display values when imperial is selected

import { formatGrouped } from "@/lib/formatNumber";

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

export function weightUnit(system: UnitSystem): "kg" | "lb" {
  return system === "imperial" ? "lb" : "kg";
}

export function fromKg(kg: number, system: UnitSystem): number {
  return system === "imperial" ? kg * LBS_PER_KG : kg;
}

// Rounding to 0.01 kg moves a weight by at most 0.011 lb, well inside the 0.1 lb
// the input shows, so a typed weight reads back exactly as entered.
export function toKg(weight: number, system: UnitSystem): number {
  return system === "imperial"
    ? Math.round((weight / LBS_PER_KG) * 100) / 100
    : weight;
}

export function formatWeight(
  kg: number,
  system: UnitSystem,
  decimals = 1,
): string {
  return `${formatGrouped(fromKg(kg, system), decimals)} ${weightUnit(system)}`;
}

// Whole units inside the metric limits, so the stated minimum is itself accepted.
export function weightLimits(
  minKg: number,
  maxKg: number,
  system: UnitSystem,
): { min: number; max: number } {
  if (system === "metric") return { min: minKg, max: maxKg };

  return {
    min: Math.ceil(minKg * LBS_PER_KG),
    max: Math.floor(maxKg * LBS_PER_KG),
  };
}

export function formatWeightRange(
  minKg: number,
  maxKg: number,
  system: UnitSystem,
): string {
  const { min, max } = weightLimits(minKg, maxKg, system);

  return `${min}-${max} ${weightUnit(system)}`;
}

export function formatHeightRange(
  minCm: number,
  maxCm: number,
  system: UnitSystem,
): string {
  if (system === "metric") return `${minCm}-${maxCm} cm`;

  const feetAndInches = (totalInches: number) =>
    `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`;

  return `${feetAndInches(Math.ceil(minCm / CM_PER_INCH))}-${feetAndInches(
    Math.floor(maxCm / CM_PER_INCH),
  )}`;
}
