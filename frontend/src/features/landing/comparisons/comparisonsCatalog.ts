import { APP_NAME } from "@/utils/appConstants";

export interface ComparisonFeatureRow {
  feature: string;
  macrotrackr: string;
  competitor: string;
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

export const COMPARISONS: readonly ComparisonDetail[] = [
  {
    slug: "myfitnesspal-alternative",
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
        macrotrackr: "Unlimited & Free",
        competitor: "Limited / Paywalled",
      },
    ],
    faqs: [
      {
        question: "Why switch from MyFitnessPal to MacroTrackr?",
        answer:
          "MacroTrackr removes the artificial paywalls (like barcode scanning and custom macro targets), strips away the ads and tracking cookies, and gives you a much faster daily logging experience.",
      },
      {
        question: "Is MacroTrackr really free and open source?",
        answer:
          "Yes! MacroTrackr is published under the AGPLv3 open-source license. You can inspect the code on GitHub, deploy it to your home server with Docker, or use our fast cloud service.",
      },
      {
        question: "Can I use MacroTrackr on mobile?",
        answer:
          "Yes. MacroTrackr is fully responsive, supports progressive web app (PWA) installation directly to your home screen, and has native iOS/Android builds.",
      },
    ],
  },
  {
    slug: "macrofactor-alternative",
    competitorName: "MacroFactor",
    title: "Free & Open-Source MacroFactor Alternative",
    shortTitle: `${APP_NAME} vs MacroFactor`,
    badge: "Smart Weekly Averages",
    tagline: "Smart macro algorithms and trend tracking without a mandatory subscription",
    subtitle:
      "Get smart weekly expenditure calculations, dynamic calorie targets, and frictionless logging without the recurring monthly bill.",
    metaDescription:
      "Looking for a free MacroFactor alternative? MacroTrackr offers adherence-neutral weekly tracking, TDEE/BMR calculators, custom macro splits, and open-source freedom.",
    keyDifferentiators: [
      {
        title: "Zero Mandatory Subscriptions",
        description:
          "MacroFactor requires a paid monthly or annual subscription with no free tier. MacroTrackr gives you complete core tracking and nutrition calculators for free.",
      },
      {
        title: "Adherence-Neutral Weekly Analytics",
        description:
          "Like MacroFactor, we focus on weekly trendlines and calorie expenditure rather than judging good vs bad days. Hit your weekly average without guilt.",
      },
      {
        title: "Open Source & Self-Hostable",
        description:
          "Keep your data on your own infrastructure with simple 1-command Docker deployment, or run directly on SQLite.",
      },
      {
        title: "Fast, Keyboard & Touch Friendly",
        description:
          "Log ingredients in seconds with intuitive search, portion scaling, and saved meal templates.",
      },
    ],
    matrix: [
      {
        feature: "Free Tier Available",
        macrotrackr: "Yes (Full Core App)",
        competitor: "No (Subscription Only)",
        highlight: true,
      },
      {
        feature: "Self-Hostable Deployment",
        macrotrackr: "Yes (Docker & SQLite)",
        competitor: "No",
        highlight: true,
      },
      {
        feature: "Weekly Trend Averages",
        macrotrackr: "Included Free",
        competitor: "Included in Paid",
      },
      {
        feature: "Free Nutrition Calculators (TDEE/BMR)",
        macrotrackr: "Included Free (No Login)",
        competitor: "In-App Only",
      },
      {
        feature: "Custom Meal Templates & Recipes",
        macrotrackr: "Included Free",
        competitor: "Included in Paid",
      },
      {
        feature: "Open Source License",
        macrotrackr: "AGPLv3",
        competitor: "Proprietary",
        highlight: true,
      },
    ],
    faqs: [
      {
        question: "How does MacroTrackr compare to MacroFactor's expenditure algorithm?",
        answer:
          "MacroTrackr combines our free TDEE, BMR, and macro calculator tools with weekly rolling intake and weight metrics, allowing you to monitor real metabolic expenditure without requiring a paid subscription.",
      },
      {
        question: "Can I host MacroTrackr on my own home server?",
        answer:
          "Yes. MacroTrackr ships with ready-to-run Docker Compose configurations with local SQLite storage for complete privacy.",
      },
    ],
  },
  {
    slug: "cronometer-alternative",
    competitorName: "Cronometer",
    title: "Clean & Modern Cronometer Alternative",
    shortTitle: `${APP_NAME} vs Cronometer`,
    badge: "Frictionless UI",
    tagline: "Streamlined macro tracking designed for speed, not overwhelming spreadsheet admin",
    subtitle:
      "All the macro precision you need to build muscle or lose fat, with a modern interface that gets out of your way.",
    metaDescription:
      "Looking for a modern Cronometer alternative? MacroTrackr provides fast meal logging, accurate macro breakdown, and weekly trend analysis with zero visual bloat.",
    keyDifferentiators: [
      {
        title: "Fast, Streamlined Logging",
        description:
          "Cronometer's interface can feel dense and clinical. MacroTrackr is optimized for 30-second meal logging with instant search and simple portion adjusters.",
      },
      {
        title: "Modern Dark-First Design System",
        description:
          "Built with Tailwind CSS, clean typography, and a polished dark-mode palette that looks right on modern devices.",
      },
      {
        title: "No Upsell Popups",
        description:
          "Track your macros and analyze your week without constant prompts to upgrade to Gold.",
      },
      {
        title: "Open Source Core",
        description:
          "Own your data with complete export options and local Docker self-hosting capabilities.",
      },
    ],
    matrix: [
      {
        feature: "User Interface Speed & Simplicity",
        macrotrackr: "Minimalist & Fast",
        competitor: "Complex / Spreadsheet-like",
        highlight: true,
      },
      {
        feature: "Custom Macro Targets",
        macrotrackr: "Included Free",
        competitor: "Included Free (Basic)",
      },
      {
        feature: "Self-Hosting Freedom",
        macrotrackr: "Yes (AGPLv3)",
        competitor: "No",
        highlight: true,
      },
      {
        feature: "Weekly Compliance Reporting",
        macrotrackr: "Included Free",
        competitor: "Gold Subscription for deep analytics",
      },
      {
        feature: "Mobile Responsive & PWA",
        macrotrackr: "Yes (Instant PWA)",
        competitor: "Yes (Native App)",
      },
    ],
    faqs: [
      {
        question: "Is MacroTrackr good for tracking protein and calories?",
        answer:
          "Yes! MacroTrackr is specifically built around daily and weekly protein, carb, fat, and calorie tracking with high-visibility target rings and compliance stats.",
      },
      {
        question: "How fast is adding a meal in MacroTrackr?",
        answer:
          "You can search by name, barcode, or quick-add manual calories in seconds, with ingredient scaling and recipe saving built in.",
      },
    ],
  },
  {
    slug: "loseit-alternative",
    competitorName: "Lose It!",
    title: "Ad-Free & Private Lose It! Alternative",
    shortTitle: `${APP_NAME} vs Lose It!`,
    badge: "Privacy & Precision",
    tagline: "Track calories and macros without interstitial ads or discount popups",
    subtitle:
      "Accurate macro splitting, custom meal logging, and weekly progress without constant upgrade pitches.",
    metaDescription:
      "Looking for a Lose It! alternative? MacroTrackr offers ad-free calorie and macro tracking, flexible target splits, and self-hosted privacy.",
    keyDifferentiators: [
      {
        title: "Zero Upgrade Funnels or Interstitial Popups",
        description:
          "Lose It! frequently interrupts your tracking with discount timers and subscription promos. MacroTrackr is clean, quiet, and respects your attention.",
      },
      {
        title: "Dedicated Macro Split Focus",
        description:
          "While Lose It! centers primarily on raw calories, MacroTrackr gives equal prominence to protein, carbohydrates, and fats for athletic performance and body composition.",
      },
      {
        title: "Complete Data Sovereignty",
        description:
          "Self-host on your own hardware or use our cloud. Full export of your meal history is always available.",
      },
    ],
    matrix: [
      {
        feature: "Ad-Free Experience",
        macrotrackr: "100% Ad-Free",
        competitor: "Ad-Supported on Free",
        highlight: true,
      },
      {
        feature: "Custom Macro Ratio Splits",
        macrotrackr: "Included Free",
        competitor: "Premium Upgrade Required",
        highlight: true,
      },
      {
        feature: "Open Source Codebase",
        macrotrackr: "AGPLv3",
        competitor: "Proprietary",
        highlight: true,
      },
      {
        feature: "Free Nutrition Calculators",
        macrotrackr: "Included Free",
        competitor: "Limited",
      },
    ],
    faqs: [
      {
        question: "Can I set custom macro gram goals in MacroTrackr?",
        answer:
          "Yes. You can set exact gram targets or percentage splits with interactive sliders in your goals settings.",
      },
      {
        question: "Is my personal data safe with MacroTrackr?",
        answer:
          "Yes. MacroTrackr has zero ad trackers or data brokers, and our open source codebase allows full auditability.",
      },
    ],
  },
] as const;

export const COMPARISONS_HUB_PATH = "/compare";

export function getComparisonBySlug(slug: string): ComparisonDetail | null {
  return COMPARISONS.find((c) => c.slug === slug) ?? null;
}
