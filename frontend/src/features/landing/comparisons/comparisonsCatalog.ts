import { APP_NAME } from "@/utils/appConstants";

export interface ComparisonFeatureRow {
  feature: string;
  macrotrackr: string;
  competitor: string;
  highlight?: boolean;
}

export interface MasterComparisonRow {
  feature: string;
  macrotrackr: string;
  myfitnesspal: string;
  macrofactor: string;
  cronometer: string;
  loseIt: string;
  highlight?: boolean;
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
    highlight: true,
  },
  {
    feature: "Cloud / Premium",
    macrotrackr: "$3.99/mo",
    myfitnesspal: "$19.99/mo",
    macrofactor: "$11.99/mo",
    cronometer: "$9.99/mo",
    loseIt: "$39.99/yr",
    highlight: true,
  },
  {
    feature: "Barcode Scanner",
    macrotrackr: "Free",
    myfitnesspal: "Paywalled",
    macrofactor: "Included",
    cronometer: "Free",
    loseIt: "Free",
    highlight: true,
  },
  {
    feature: "Ad-Free Interface",
    macrotrackr: "100% Ad-Free",
    myfitnesspal: "Ads & popups on Free",
    macrofactor: "Ad-Free",
    cronometer: "Ads on Free",
    loseIt: "Ads & popups on Free",
    highlight: true,
  },
  {
    feature: "Self-Hostable",
    macrotrackr: "Yes (AGPLv3)",
    myfitnesspal: "No",
    macrofactor: "No",
    cronometer: "No",
    loseIt: "No",
    highlight: true,
  },
  {
    feature: "Weekly Trend Averages",
    macrotrackr: "Free",
    myfitnesspal: "Paywalled",
    macrofactor: "Included",
    cronometer: "Gold tier only",
    loseIt: "Paywalled",
    highlight: true,
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
        title: "No Barcode Scanner Paywall",
        description:
          "MyFitnessPal locked barcode scanning behind an expensive premium tier. MacroTrackr provides fast OpenFoodFacts barcode scanning and instant lookup 100% free.",
      },
      {
        title: "Clean & Ad-Free Experience",
        description:
          "No intrusive video ads, sponsored takeovers, or laggy dashboards. Just a high-density, lightning-fast logging workflow.",
      },
      {
        title: "Self-Hostable with Full Data Privacy",
        description:
          "Run your own instance with Docker and SQLite or use our cloud version. Your personal nutrition data is never tracked, packaged, or sold to advertisers.",
      },
      {
        title: "Weekly Compliance over Daily Guilt",
        description:
          "Real progress happens across weeks. MacroTrackr highlights weekly calorie and macro rolling averages so one off-plan meal never derails your consistency.",
      },
    ],
    matrix: [
      {
        feature: "Barcode Scanner",
        macrotrackr: "Included Free",
        competitor: "Paywalled ($19.99/mo)",
        highlight: true,
      },
      {
        feature: "Custom Macro Targets (Grams & %)",
        macrotrackr: "Included Free",
        competitor: "Limited on Free tier",
        highlight: true,
      },
      {
        feature: "Ad-Free Clean Interface",
        macrotrackr: "100% Ad-Free",
        competitor: "Heavy Ads on Free",
        highlight: true,
      },
      {
        feature: "Self-Hostable (Docker / SQLite)",
        macrotrackr: "Yes (AGPLv3 Open Source)",
        competitor: "No (Proprietary)",
        highlight: true,
      },
      {
        feature: "Weekly Rolling Averages & Trends",
        macrotrackr: "Included Free",
        competitor: "Premium Only",
      },
      {
        feature: "Multi-Ingredient Custom Meals",
        macrotrackr: "Included Free",
        competitor: "Included",
      },
      {
        feature: "Data Export (JSON / CSV)",
        macrotrackr: "Included Free",
        competitor: "Premium Only",
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
        title: "No Mandatory Monthly Subscription",
        description:
          "MacroFactor costs $11.99/mo or $71.99/yr with zero free tier. MacroTrackr provides full macro tracking for free self-hosted or $3.99/mo cloud.",
      },
      {
        title: "Transparent & User-Controlled Targets",
        description:
          "You stay in full control of your caloric deficit, surplus, and macronutrient ratios without an opaque black-box algorithm overriding your numbers.",
      },
      {
        title: "Self-Hosted & Offline Capable",
        description:
          "Own your data end-to-end. Run MacroTrackr on your own home server or private VPS with zero telemetry.",
      },
      {
        title: "Lightweight Web & PWA",
        description:
          "Use MacroTrackr seamlessly on desktop, tablet, and mobile with lightning-fast keyboard-first meal entry.",
      },
    ],
    matrix: [
      {
        feature: "Price",
        macrotrackr: "Free Core & Self-Hosted / $3.99 Cloud",
        competitor: "$11.99 / month (No free tier)",
        highlight: true,
      },
      {
        feature: "Self-Hostable",
        macrotrackr: "Yes (Docker + SQLite)",
        competitor: "No (Closed Source)",
        highlight: true,
      },
      {
        feature: "Weekly Rolling Averages",
        macrotrackr: "Included Free",
        competitor: "Included in Paid Sub",
      },
      {
        feature: "Barcode Scanner",
        macrotrackr: "Included Free",
        competitor: "Included in Paid Sub",
      },
      {
        feature: "User Target Control",
        macrotrackr: "Complete Manual & Percentage Control",
        competitor: "Algorithm Guided",
      },
      {
        feature: "Open Source Codebase",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No (Proprietary)",
        highlight: true,
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
        title: "Clean, High-Density Interface",
        description:
          "Cronometer's UI can feel overwhelming with dozens of micronutrient gauges. MacroTrackr focuses on protein, carbs, fats, and energy with razor-sharp clarity.",
      },
      {
        title: "Zero Banner Ads on Free",
        description:
          "Cronometer Free displays prominent banner advertisements. MacroTrackr is 100% ad-free across all versions.",
      },
      {
        title: "Instant Multi-Ingredient Composition",
        description:
          "Build and scale multi-ingredient recipes with instant dynamic macro recalculations.",
      },
      {
        title: "Open Source Freedom",
        description:
          "Full code transparency under the AGPLv3 license. You own your data and instance forever.",
      },
    ],
    matrix: [
      {
        feature: "User Interface",
        macrotrackr: "Streamlined, High-Density & Modern",
        competitor: "Dense Spreadsheet / Micronutrient heavy",
        highlight: true,
      },
      {
        feature: "Advertisements",
        macrotrackr: "Zero Ads (Always)",
        competitor: "Banner Ads on Free Tier",
        highlight: true,
      },
      {
        feature: "Barcode Scanner",
        macrotrackr: "Included Free",
        competitor: "Included Free",
      },
      {
        feature: "Custom Macro Targets",
        macrotrackr: "Included Free",
        competitor: "Included Free",
      },
      {
        feature: "Self-Hosting",
        macrotrackr: "Yes (Docker + SQLite)",
        competitor: "No (Cloud Only)",
        highlight: true,
      },
      {
        feature: "Cloud Sync Option",
        macrotrackr: "Available ($3.99/mo)",
        competitor: "Available ($9.99/mo Gold)",
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
          "Yes! MacroTrackr runs in a single lightweight Docker container with an embedded SQLite database, perfect for Raspberry Pi, Unraid, Synology, or any home server.",
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
        title: "No Aggressive Upsell Popups",
        description:
          "Lose It! frequently interrupts users with subscription popups and lifetime premium offers. MacroTrackr offers a peaceful, distraction-free environment.",
      },
      {
        title: "Gram-Accurate Custom Macros",
        description:
          "Customizing individual macronutrient gram targets is unrestricted and free in MacroTrackr.",
      },
      {
        title: "Weekly Compliance Focus",
        description:
          "View your 7-day rolling calories and macronutrient breakdown to stay consistent over the long haul.",
      },
      {
        title: "Open Source & Self-Hostable",
        description:
          "Never worry about an app company shutting down or changing terms. Run your own server with Docker.",
      },
    ],
    matrix: [
      {
        feature: "Custom Macro Gram Goals",
        macrotrackr: "Included Free",
        competitor: "Paywalled ($39.99/yr)",
        highlight: true,
      },
      {
        feature: "Popups & Upsells",
        macrotrackr: "None",
        competitor: "Frequent discount popups",
        highlight: true,
      },
      {
        feature: "Barcode Scanner",
        macrotrackr: "Included Free",
        competitor: "Included Free",
      },
      {
        feature: "Self-Hosting",
        macrotrackr: "Yes (Docker + SQLite)",
        competitor: "No",
        highlight: true,
      },
      {
        feature: "Weekly Rolling Averages",
        macrotrackr: "Included Free",
        competitor: "Paywalled Insights",
      },
      {
        feature: "Open Source",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
        highlight: true,
      },
    ],
    faqs: [
      {
        question: "Can I set custom macro targets without paying?",
        answer:
          "Yes! In MacroTrackr, setting custom calorie goals and gram/percentage macro splits is 100% free.",
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
