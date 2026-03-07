import {
  BarChartIcon,
  CheckCircleIcon,
  CheckIcon,
  ExternalLinkIcon,
  NutrientIcon,
  PlusCircleIcon,
  SearchIcon,
  ShieldCheckIcon,
  StarIcon,
  TargetIcon,
  TrendingUpIcon,
  WeightIcon,
} from "@/components/ui";

/**
 * Features for the stock ticker-style display on the landing page
 */
export const FEATURES = [
  { name: "Macro Tracking", description: "Log protein, carbs, and fats instantly with automatic calorie calculation.", icon: NutrientIcon },
  { name: "Food Search", description: "Find any food in seconds with our comprehensive, searchable database.", icon: SearchIcon },
  { name: "Goal Setting", description: "Set personalised targets aligned with your fitness goals and timeline.", icon: TargetIcon },
  { name: "Weight Logging", description: "Track your weight journey with clear, visual progress charts.", icon: WeightIcon },
  { name: "Habit Tracking", description: "Build lasting habits with daily check-ins and streak tracking.", icon: CheckCircleIcon },
  { name: "Custom Macro Targets", description: "Fine-tune your macro split to match your lifestyle and preferences.", icon: BarChartIcon },
  { name: "Progress Insights", description: "Spot trends instantly with visual analytics that reveal what's working.", icon: TrendingUpIcon },
  { name: "Secure Authentication", description: "Your data stays safe with Google or email sign-in via Clerk.", icon: ShieldCheckIcon },
  { name: "Pro Subscription", description: "Unlock advanced analytics, custom insights, and priority support.", icon: StarIcon },
  { name: "Cross-Platform", description: "Seamless tracking on desktop or mobile—wherever life takes you.", icon: ExternalLinkIcon },
];

export const trustIndicators = [
  {
    icon: CheckIcon,
    title: "Easy Setup",
    description: "Start tracking in under 2 minutes",
    color: "green",
  },
  {
    icon: CheckIcon,
    title: "Real-time Tracking",
    description: "Instant macro calculations",
    color: "blue",
  },
  {
    icon: CheckIcon,
    title: "Advanced Analytics",
    description: "Actionable insights at a glance",
    color: "purple",
  },
];
export const landingItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 140, damping: 18 },
  },
} as const;

export const trustElements = [
  { text: "Always Free Version" },
  { text: "No Credit Card Required" },
  { text: "Cancel Anytime" },
];

export const features = [
  {
    icon: PlusCircleIcon,
    title: "Smart Meal Logging",
    description:
      "Log meals in seconds with our intelligent food database and barcode scanner. Get accurate macro breakdowns instantly.",
  },
  {
    icon: BarChartIcon,
    title: "Personal Goal Setting",
    description:
      "Set custom macro targets tailored to your goals and lifestyle. Watch your progress unfold in real-time.",
  },
  {
    icon: TrendingUpIcon,
    title: "Advanced Analytics",
    description:
      "Transform data into insights with detailed charts and trend analysis that guide smarter nutrition decisions.",
  },
];
