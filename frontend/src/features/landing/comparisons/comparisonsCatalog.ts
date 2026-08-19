import { APP_NAME } from "@/utils/appConstants";

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
    macrotrackr: "$3.99/mo",
    myfitnesspal: "$19.99/mo",
    macrofactor: "$11.99/mo",
    cronometer: "$9.99/mo",
    loseIt: "$9.99/mo",
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

export const COMPARISONS: readonly ComparisonDetail[] = [
  {
    slug: "myfitnesspal",
    competitorName: "MyFitnessPal",
    title: "The Best Free, Open-Source MyFitnessPal Alternative",
    shortTitle: `${APP_NAME} vs MyFitnessPal`,
    badge: "100% Free Core Features",
    tagline: "Free barcode scanning, zero banner ads, and complete data privacy",
    subtitle:
      "Log meals in seconds, scan barcodes without a $19.99/mo paywall, and keep your nutrition data completely private.",
    metaDescription:
      "Looking for a free MyFitnessPal alternative? MacroTrackr gives you fast barcode scanning, customizable macro splits, weekly compliance, and self-hosted privacy with zero paywalled basics.",
    keyDifferentiators: [
      {
        title: "No Barcode Paywall",
        description:
          "Scan barcodes and search grocery items without paying a $19.99/mo subscription.",
      },
      {
        title: "Clean & Ad-Free",
        description:
          "Zero video ads, banner clutter, or slow dashboards.",
      },
      {
        title: "Self-Hostable Privacy",
        description:
          "Run locally with Docker or sync via cloud; your nutrition data is never sold.",
      },
      {
        title: "Weekly Compliance",
        description:
          "Track rolling weekly averages to focus on consistency over single-day spikes.",
      },
    ],
    matrix: [
      {
        feature: "Free Tier",
        macrotrackr: "Full (Self-Hosted)",
        competitor: "Limited (Ads)",
      },
      {
        feature: "Cloud / Premium",
        macrotrackr: "$3.99/mo",
        competitor: "$19.99/mo",
      },
      {
        feature: "Barcode Scanner",
        macrotrackr: "Free",
        competitor: "Paywalled ($19.99/mo)",
      },
      {
        feature: "Custom Macro Targets",
        macrotrackr: "Free",
        competitor: "Paywalled",
      },
      {
        feature: "Ad-Free Interface",
        macrotrackr: "100% Ad-Free",
        competitor: "Ads on Free",
      },
      {
        feature: "Self-Hostable",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
      },
      {
        feature: "Weekly Trend Averages",
        macrotrackr: "Free",
        competitor: "Paywalled",
      },
      {
        feature: "Multi-Ingredient Meals",
        macrotrackr: "Free",
        competitor: "Included",
      },
      {
        feature: "Data Export",
        macrotrackr: "Free",
        competitor: "Paywalled",
      },
    ],
    faqs: [
      {
        question: "Why switch from MyFitnessPal to MacroTrackr?",
        answer:
          "MacroTrackr keeps essential nutrition tracking tools—like barcode scanning, gram-accurate macro targets, and rolling averages—completely free and ad-free. Plus, you can self-host your own instance for total privacy.",
      },
      {
        question: "Does MacroTrackr have an open food database?",
        answer:
          "Yes. MacroTrackr connects directly to the OpenFoodFacts database with millions of verified global grocery products, along with full support for custom ingredients and saved meals.",
      },
      {
        question: "Is MacroTrackr free?",
        answer:
          "MacroTrackr is fully open source (AGPLv3) and free to self-host with Docker. We also offer an affordable hosted cloud version with automatic sync and backups.",
      },
    ],
  },
  {
    slug: "macrofactor",
    competitorName: "MacroFactor",
    title: "Open-Source MacroFactor Alternative for Calorie & Macro Tracking",
    shortTitle: `${APP_NAME} vs MacroFactor`,
    badge: "Open-Source & Transparent",
    tagline: "Weekly average trend tracking without a mandatory monthly subscription",
    subtitle:
      "Get clear weekly calorie and macro compliance metrics without paying $11.99/month for algorithmic coaching.",
    metaDescription:
      "MacroTrackr vs MacroFactor: Compare features, pricing, and philosophy. Learn how MacroTrackr delivers trend tracking and smooth logging with zero monthly lock-in.",
    keyDifferentiators: [
      {
        title: "No Mandatory Subscription",
        description:
          "Full macro tracking free self-hosted or $3.99/mo cloud vs $11.99/mo.",
      },
      {
        title: "Transparent Target Control",
        description:
          "Full control of deficits and macros without a black-box algorithm.",
      },
      {
        title: "Self-Hosted Privacy",
        description:
          "Host on your own server with SQLite and zero external telemetry.",
      },
      {
        title: "Fast Cross-Platform App",
        description:
          "Instant keyboard-first meal entry across desktop and mobile devices.",
      },
    ],
    matrix: [
      {
        feature: "Free Tier",
        macrotrackr: "Full (Self-Hosted)",
        competitor: "None",
      },
      {
        feature: "Cloud / Premium",
        macrotrackr: "$3.99/mo",
        competitor: "$11.99/mo",
      },
      {
        feature: "Self-Hostable",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
      },
      {
        feature: "Weekly Trend Averages",
        macrotrackr: "Free",
        competitor: "Included",
      },
      {
        feature: "Barcode Scanner",
        macrotrackr: "Free",
        competitor: "Included ($11.99/mo)",
      },
      {
        feature: "User Target Control",
        macrotrackr: "Full Control",
        competitor: "Algorithm Guided",
      },
      {
        feature: "Open Source",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
      },
    ],
    faqs: [
      {
        question: "How does MacroTrackr differ from MacroFactor?",
        answer:
          "MacroFactor is a proprietary, subscription-only app centered on automated expenditure adjustments. MacroTrackr is an open-source, user-empowering tracker giving you full control of your macro targets with weekly average visibility and self-hosting capabilities.",
      },
      {
        question: "Can I track weekly averages in MacroTrackr?",
        answer:
          "Yes. MacroTrackr calculates weekly rolling averages and visual compliance rings so you can evaluate long-term trends rather than stressing over single-day spikes.",
      },
    ],
  },
  {
    slug: "cronometer",
    competitorName: "Cronometer",
    title: "Lightweight, Focused Cronometer Alternative",
    shortTitle: `${APP_NAME} vs Cronometer`,
    badge: "Clean & Distraction-Free",
    tagline: "Streamlined macronutrient logging without the dense spreadsheet clutter",
    subtitle:
      "All the macro precision you need to build muscle or lose fat, with an intuitive UI that gets out of your way.",
    metaDescription:
      "Compare MacroTrackr and Cronometer. Discover a streamlined, ad-free macro tracker with instant logging and self-hosted privacy.",
    keyDifferentiators: [
      {
        title: "Clean, Focused Interface",
        description:
          "Track calories and macros without overwhelming spreadsheet clutter.",
      },
      {
        title: "Zero Banner Ads",
        description:
          "100% ad-free experience on all tiers.",
      },
      {
        title: "Fast Recipe Composition",
        description:
          "Compose and scale multi-ingredient meals with instant macro recalculation.",
      },
      {
        title: "Open Source Ownership",
        description:
          "AGPLv3 codebase with total data control and no vendor lock-in.",
      },
    ],
    matrix: [
      {
        feature: "Free Tier",
        macrotrackr: "Full (Self-Hosted)",
        competitor: "Limited (Ads)",
      },
      {
        feature: "Cloud / Premium",
        macrotrackr: "$3.99/mo",
        competitor: "$9.99/mo",
      },
      {
        feature: "User Interface",
        macrotrackr: "Streamlined & Modern",
        competitor: "Dense / Spreadsheet",
      },
      {
        feature: "Advertisements",
        macrotrackr: "Zero Ads",
        competitor: "Banner Ads on Free",
      },
      {
        feature: "Barcode Scanner",
        macrotrackr: "Free",
        competitor: "Free",
      },
      {
        feature: "Custom Macro Targets",
        macrotrackr: "Free",
        competitor: "Free",
      },
      {
        feature: "Self-Hostable",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
      },
    ],
    faqs: [
      {
        question: "When should I choose MacroTrackr over Cronometer?",
        answer:
          "If you primarily care about hitting calorie and macronutrient targets (protein, carbs, fats) with high speed and zero ads, MacroTrackr provides a faster and cleaner experience than Cronometer's micronutrient-heavy dashboard.",
      },
      {
        question: "Can I self-host MacroTrackr at home?",
        answer:
          "Yes. MacroTrackr runs as a single Docker container with an embedded SQLite database, which is enough for a Raspberry Pi, Unraid, Synology or any home server.",
      },
    ],
  },
  {
    slug: "lose-it",
    competitorName: "Lose It!",
    title: "The Ad-Free, Privacy-First Lose It! Alternative",
    shortTitle: `${APP_NAME} vs Lose It!`,
    badge: "No Popups or Paywalls",
    tagline: "Custom macro targets and weekly progress without aggressive premium upsells",
    subtitle:
      "Track calories and macros with full flexibility, zero annoying discount popups, and complete data ownership.",
    metaDescription:
      "Lose It! alternative: MacroTrackr offers free custom macro goals, ad-free tracking, weekly averages, and open-source self-hosting.",
    keyDifferentiators: [
      {
        title: "No Aggressive Popups",
        description:
          "Clean tracking without constant discount modals and lifetime upgrade prompts.",
      },
      {
        title: "Free Custom Macro Goals",
        description:
          "Set gram-accurate protein, carb, and fat targets with zero paywalls.",
      },
      {
        title: "Weekly Rolling Compliance",
        description:
          "Evaluate 7-day nutritional trends to maintain steady long-term progress.",
      },
      {
        title: "Open Source & Self-Hostable",
        description:
          "Deploy with 1 Docker command and keep your history forever.",
      },
    ],
    matrix: [
      {
        feature: "Free Tier",
        macrotrackr: "Full (Self-Hosted)",
        competitor: "Limited (Ads)",
      },
      {
        feature: "Cloud / Premium",
        macrotrackr: "$3.99/mo",
        competitor: "$9.99/mo",
      },
      {
        feature: "Custom Macro Targets",
        macrotrackr: "Free",
        competitor: "Paywalled",
      },
      {
        feature: "Popups & Upsells",
        macrotrackr: "None",
        competitor: "Frequent popups",
      },
      {
        feature: "Barcode Scanner",
        macrotrackr: "Free",
        competitor: "Free",
      },
      {
        feature: "Self-Hostable",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
      },
      {
        feature: "Weekly Trend Averages",
        macrotrackr: "Free",
        competitor: "Paywalled",
      },
      {
        feature: "Open Source",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
      },
    ],
    faqs: [
      {
        question: "Can I set custom macro targets without paying?",
        answer:
          "Yes. Custom calorie goals and gram or percentage macro splits are on the free tier.",
      },
      {
        question: "Is there a mobile app?",
        answer:
          "MacroTrackr is a Progressive Web App (PWA) that installs directly on iOS and Android with full touch controls and offline support, plus native mobile builds.",
      },
    ],
  },
] as const;

export const COMPARISONS_HUB_PATH = "/compare";

export function getComparisonBySlug(slug: string): ComparisonDetail | null {
  return COMPARISONS.find((c) => c.slug === slug) ?? null;
}
