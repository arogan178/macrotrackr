/**
 * Get chart Y domain with padding identical to current behavior.
 */
export function getChartDomain(
  weights: number[],
  targetWeight?: number,
): { domainMin: number; domainMax: number } {
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;

  const effectiveMin = Math.min(minWeight, targetWeight ?? Infinity);
  const effectiveMax = Math.max(maxWeight, targetWeight ?? 0);

  const padding = Math.max(1, (effectiveMax - effectiveMin) * 0.05);
  const calculatedMin = Math.floor(Math.max(0, effectiveMin - padding));
  const calculatedMax = Math.ceil(effectiveMax + padding);

  if (calculatedMax - calculatedMin < 2) {
    return { domainMin: calculatedMin - 1, domainMax: calculatedMax + 1 };
  }

  return { domainMin: calculatedMin, domainMax: calculatedMax };
}