// Centralized pricing plan configuration for Macro Tracker
// Centralized monthly and yearly pricing
export const PRICING = {
  monthly: 3.99,
  yearly: 29.99,
};

export interface PricingPlan {
  name: string;
  features: string[];
  price: number | string;
  suffix: string;
  equivalent?: string;
  isPopular?: boolean;
  buttonText: string;
  buttonVariant: "primary" | "secondary" | "danger" | "success" | "ghost";
  buttonClassName: string;
  featureIconColor: string;
  featureTextClass: string;
  cardClassName?: string;
  description?: string;
}

const FREE_FEATURES = [
  "Unlimited Macro Tracking",
  "Meal Types & Time Logging",
  "Weight Logging",
  "Basic Goal Setting",
  "7-Day Reporting View",
  "60-Day Entry History",
  "Save up to 5 Meals",
];

export const PRICING_PLANS = {
  free: {
    name: "Free",
    features: FREE_FEATURES,
    price: "$0",
    suffix: "/forever",
    buttonText: "Get Started For Free",
    buttonVariant: "ghost",
    buttonClassName:
      "w-full bg-surface-2 hover:bg-surface-3 text-foreground border border-border hover:border-primary transition-all duration-300 text-xl px-12 py-4 font-semibold",
    featureIconColor: "text-primary",
    featureTextClass: "text-foreground",
    cardClassName: "bg-surface hover:bg-surface-2 transition-colors duration-300",
    description: "Perfect for getting started",
  },
  pro: {
    name: "Pro",
    features: [
      "Everything in Free, plus:",
      "Unlimited Habit Tracking",
      "Unlimited Meal Saver",
      "30 & 90-Day Reporting",
      "Unlimited Entry History",
      "Advanced Analytics & Insights",
      "CSV Data Export",
    ],
    // price, suffix, equivalent, and buttonText will be set dynamically in the component
    price: PRICING.monthly,
    suffix: "/month",
    buttonText: "Get Pro Now",
    buttonVariant: "primary",
    buttonClassName:
      "w-full bg-primary hover:bg-secondary shadow-success transition-all duration-300 text-xl px-12 py-4 font-semibold",
    featureIconColor: "text-primary",
    featureTextClass: "text-foreground font-medium",
    cardClassName:
      "bg-surface-2 border-2 border-primary/40 shadow-success",
    isPopular: true,
    description: "Unlock your full potential",
  },
};
