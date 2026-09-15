import comparisonsData from "@/data/comparisons.json";

export interface ComparisonFeatureRow {
  feature: string;
  macrotrackr: string;
  competitor: string;
}

export interface MasterComparisonRow {
  feature: string;
  macrotrackr: string;
  myfitnesspal: string;
  macrofactor: string;
  cronometer: string;
  loseIt: string;
}

export interface ComparisonDetail {
  slug: string;
  competitorName: string;
  title: string;
  shortTitle: string;
  badge: string;
  tagline: string;
  subtitle: string;
  metaDescription: string;
  keyDifferentiators: Array<{
    title: string;
    description: string;
  }>;
  matrix: ComparisonFeatureRow[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const MASTER_COMPARISON_MATRIX: readonly MasterComparisonRow[] = [
  {
    feature: "Free Tier",
    macrotrackr: "Full (Self-Hosted)",
    myfitnesspal: "Limited (Ads)",
    macrofactor: "None",
    cronometer: "Limited (Ads)",
    loseIt: "Limited (Ads)",
  },
  {
    feature: "Cloud / Premium",
    macrotrackr: "$3.99/mo or $29.99/yr",
    myfitnesspal: "$19.99/mo or $79.99/yr",
    macrofactor: "$11.99/mo or $71.99/yr",
    cronometer: "$10.99/mo or $59.99/yr",
    loseIt: "$9.99/mo or $39.99/yr",
  },
  {
    feature: "Barcode Scanner",
    macrotrackr: "Free",
    myfitnesspal: "Paywalled",
    macrofactor: "Included",
    cronometer: "Free",
    loseIt: "Free",
  },
  {
    feature: "Ad-Free Interface",
    macrotrackr: "100% Ad-Free",
    myfitnesspal: "Ads & popups on Free",
    macrofactor: "Ad-Free",
    cronometer: "Ads on Free",
    loseIt: "Ads & popups on Free",
  },
  {
    feature: "Self-Hostable",
    macrotrackr: "Yes (AGPLv3)",
    myfitnesspal: "No",
    macrofactor: "No",
    cronometer: "No",
    loseIt: "No",
  },
  {
    feature: "Weekly Trend Averages",
    macrotrackr: "Free",
    myfitnesspal: "Paywalled",
    macrofactor: "Included",
    cronometer: "Gold tier only",
    loseIt: "Paywalled",
  },
  {
    feature: "Custom Macro Grams & %",
    macrotrackr: "Free",
    myfitnesspal: "Paywalled",
    macrofactor: "Included",
    cronometer: "Included",
    loseIt: "Paywalled",
  },
  {
    feature: "Saved Multi-Item Meals",
    macrotrackr: "Free",
    myfitnesspal: "Included",
    macrofactor: "Included",
    cronometer: "Included",
    loseIt: "Included",
  },
  {
    feature: "Installable PWA",
    macrotrackr: "Yes (PWA + Mobile)",
    myfitnesspal: "No",
    macrofactor: "No",
    cronometer: "Web + Mobile",
    loseIt: "No",
  },
  {
    feature: "Open Source",
    macrotrackr: "Yes (AGPLv3)",
    myfitnesspal: "No",
    macrofactor: "No",
    cronometer: "No",
    loseIt: "No",
  },
];

/**
 * Content lives in `src/data/comparisons.json` so `scripts/prerender.mjs` can
 * read the same copy. The pre-renderer runs in Node and cannot import this
 * module; when it kept its own transcription the two drifted, and the served
 * page carried different headings and FAQs from the rendered one.
 */
export const COMPARISONS: readonly ComparisonDetail[] = comparisonsData;

export const COMPARISONS_HUB_PATH = "/compare";

export function getComparisonBySlug(slug: string): ComparisonDetail | null {
  return COMPARISONS.find((c) => c.slug === slug) ?? null;
}
