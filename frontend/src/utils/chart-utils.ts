/**
 * Formats a date string into a more readable format
 * @param entry The entry containing a date name
 * @param selectedRange The selected date range (7, 30, 90, etc.)
 */
export function formatDateName(
  entry: { name: string },
  selectedRange: number
): string {
  // For 7 days, keep daily format but ensure it's short
  if (selectedRange <= 7) {
    return entry.name.substring(0, 6); // e.g., "Apr 18"
  }

  // For 30 days, group into weeks
  else if (selectedRange <= 30) {
    const parts = entry.name.split(" ");
    const month = parts[0]; // e.g., "Apr"
    const day = parseInt(parts[1] || "1"); // e.g., "18" -> 18

    // Get month number from abbreviation (0-indexed)
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    // Create a date object for this entry
    const currentYear = new Date().getFullYear();
    const monthNum = monthMap[month] !== undefined ? monthMap[month] : 0;
    const entryDate = new Date(currentYear, monthNum, day);

    // Calculate the week number within the month
    const firstDayOfMonth = new Date(currentYear, monthNum, 1);
    const daysSinceFirstDay = Math.floor(
      (entryDate.getTime() - firstDayOfMonth.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekOfMonth = Math.floor(daysSinceFirstDay / 7) + 1;

    return `W${weekOfMonth} ${month}`; // e.g., "W3 Apr"
  }

  // For 90+ days, group into months
  else {
    // Try to extract month and day from entry name
    const parts = entry.name.split(" ");
    const month = parts[0];
    const day = parts.length > 1 ? parts[1] : "";
    return `${month} ${day}`; // e.g., "Apr 18"
  }
}

/**
 * Get descriptive text for the selected date range
 */
export function getRangeDescription(selectedRange: number = 7): string {
  return `Last ${selectedRange} Days`;
}

/**
 * Calculate macro percentages from a nutrition entry
 */
export function getMacroPercentages(entry: {
  protein: number;
  carbs: number;
  fats: number;
  calories?: number;
}) {
  const { protein, carbs, fats } = entry;
  const calories = entry.calories || protein * 4 + carbs * 4 + fats * 9;

  // If total calories from entry is 0, all percentages are 0
  if (calories === 0) {
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  }

  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatsCals = fats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals;

  // If the sum of calories from macros is 0, all macro percentages are 0
  if (totalMacroCals === 0) {
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  }

  // Calculate exact percentages based on total calories from macros
  const proteinPctExact = (proteinCals / totalMacroCals) * 100;
  const carbsPctExact = (carbsCals / totalMacroCals) * 100;

  let pOut = Math.round(proteinPctExact);
  let cOut = Math.round(carbsPctExact);

  // Fats takes the remainder to ensure the sum is 100
  let fOut = 100 - pOut - cOut;

  // Handle edge cases to ensure percentages sum to 100 and are non-negative
  if (fOut < 0) {
    fOut = 0;
    const excessSum = pOut + cOut - 100;

    if (pOut + cOut > 0) {
      const pReduction = Math.round(excessSum * (pOut / (pOut + cOut)));
      const cReduction = excessSum - pReduction;

      pOut -= pReduction;
      cOut -= cReduction;
    } else {
      pOut = 50;
      cOut = 50;
    }

    pOut = Math.max(0, pOut);
    cOut = Math.max(0, cOut);
    fOut = 100 - pOut - cOut;
  }

  // Final adjustments to ensure percentages sum to 100
  pOut = Math.max(0, pOut);
  cOut = Math.max(0, cOut);
  fOut = Math.max(0, fOut);

  const finalSum = pOut + cOut + fOut;
  if (finalSum !== 100 && totalMacroCals > 0) {
    fOut += 100 - finalSum;
  }

  fOut = Math.max(0, fOut);
  const checkSum = pOut + cOut + fOut;
  if (checkSum !== 100) {
    fOut = 100 - pOut - cOut;
  }

  return {
    proteinPct: pOut,
    carbsPct: cOut,
    fatsPct: Math.max(0, fOut),
  };
}

/**
 * Format a number with appropriate units for display
 */
export function formatNumberWithUnit(value: number, statType: string): string {
  const unit =
    statType === "calories"
      ? "kcal"
      : ["protein", "carbs", "fats"].includes(statType)
      ? "g"
      : "";

  return `${value.toFixed(1)}${unit ? " " + unit : ""}`;
}
