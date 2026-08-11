/**
 * Single source of truth for the public calculators. The header dropdown, the
 * tools hub, and the "related calculators" strip on each page all read from
 * here so a new calculator only needs to be described once.
 */
export interface CalculatorTool {
  /** Full page title, also used as the hub card heading. */
  title: string;
  /** Shorter label for dense surfaces; falls back to `title` when omitted. */
  navLabel?: string;
  path: string;
  /** One-line summary for the header dropdown and related-tool cards. */
  tagline: string;
  /** Longer supporting copy for the tools hub. */
  description: string;
  /** Renders full width at the top of the hub grid. */
  featured?: boolean;
}

export const CALCULATOR_TOOLS: readonly CalculatorTool[] = [
  {
    title: "TDEE Calculator",
    path: "/tools/tdee-calculator",
    tagline: "Maintenance calories and activity burn",
    description:
      "Start with your estimated maintenance calories, then use them to plan a cut, maintenance phase, or gain phase.",
    featured: true,
  },
  {
    title: "BMR Calculator",
    path: "/tools/bmr-calculator",
    tagline: "Resting energy your body burns at rest",
    description:
      "Estimate your Basal Metabolic Rate—the energy your body uses at rest for vital functions.",
  },
  {
    title: "Macro Calculator",
    path: "/tools/macro-calculator",
    tagline: "Protein, carb, and fat percentage splits",
    description:
      "Set daily protein, carb, and fat ratios with interactive, lockable percentage sliders.",
  },
  {
    title: "Weight Loss & Timeline Calculator",
    navLabel: "Weight Loss Calculator",
    path: "/tools/weight-loss-calculator",
    tagline: "Calorie deficit, weekly pace, and goal date",
    description:
      "Estimate daily calorie deficits, weekly progress rates, and projected completion dates for your target weight.",
  },
  {
    title: "Protein Intake Calculator",
    navLabel: "Protein Calculator",
    path: "/tools/protein-calculator",
    tagline: "Daily and per-meal protein targets",
    description:
      "Estimate daily and per-meal protein targets for muscle building, fat loss, or endurance goals.",
  },
] as const;

export const TOOLS_HUB_PATH = "/tools";
