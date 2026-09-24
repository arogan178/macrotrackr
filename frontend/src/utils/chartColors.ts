// Shared color definitions for charts
export interface ColorGradient {
  base: string;
  gradient: [string, string];
}

export interface ColorPalette {
  [key: string]: ColorGradient;
}

// Macro color palette — the same three hues the tokens declare, so a chart
// series and its legend chip cannot drift apart.
//
// Protein is green because that is what every tracker's users already read it
// as, but it is emerald (158°) rather than the brand's yellow-green (112°): the
// two collisions worth breaking were protein being byte-identical to the brand
// green and fats being byte-identical to the error red. Convention is kept; the
// double meanings are not.
/**
 * Chart series colours, named as custom properties rather than transcribed.
 *
 * `var()` resolves at paint time in the SVG attributes recharts writes, so this
 * follows `style.css` with no import-order problem and nothing to keep in step
 * by hand. The `base` values used to be hex copies annotated with the token they
 * were copied from, which is the exact shape the snapshot canvas and the Clerk
 * theme were in before both went stale.
 *
 * Protein is green because that is what every tracker's users already read it
 * as, but it is emerald (158°) rather than the brand's yellow-green (112°): the
 * two collisions worth breaking were protein being byte-identical to the brand
 * green and fats being byte-identical to the error red. Convention is kept; the
 * double meanings are not.
 */
export const MACRO_COLORS: ColorPalette = {
  protein: {
    base: "var(--color-protein)",
    gradient: ["var(--color-protein)", "var(--color-protein)"],
  },
  carbs: {
    base: "var(--color-carbs)",
    gradient: ["var(--color-carbs)", "var(--color-carbs)"],
  },
  fats: {
    base: "var(--color-fats)",
    gradient: ["var(--color-fats)", "var(--color-fats)"],
  },
};

/**
 * Meal types run in time order, so they are one brand-green lightness ramp from
 * breakfast to snack. They used to borrow the macro hues, which put a blue
 * "Breakfast" beside a blue "Carbs" on the same Analytics row. The ends mix
 * toward white and toward the panel so four steps stay apart at a legend dot.
 */
function mealShade(color: string): ColorGradient {
  return { base: color, gradient: [color, color] };
}

export const MEAL_COLORS: ColorPalette = {
  breakfast: mealShade(
    "color-mix(in oklab, var(--color-primary) 45%, var(--color-foreground))",
  ),
  lunch: mealShade("var(--color-primary)"),
  dinner: mealShade(
    "color-mix(in oklab, var(--color-primary) 55%, var(--color-surface))",
  ),
  snack: mealShade(
    "color-mix(in oklab, var(--color-primary) 28%, var(--color-surface))",
  ),
};

// Stat type color mapping
// Five identical greens told the reader nothing. Calories are the live value,
// so they keep the brand colour; the macros carry their own.
export const STAT_COLORS = {
  calories: "bg-primary",
  protein: "bg-protein",
  carbs: "bg-carbs",
  fats: "bg-fats",
  count: "bg-surface-3",
};

// Get unit based on stat type
export function getUnitForStat(statType: string): string {
  switch (statType) {
    case "calories": {
      return "kcal";
    }
    case "protein":
    case "carbs":
    case "fats": {
      return "g";
    }
    default: {
      return "";
    }
  }
}
