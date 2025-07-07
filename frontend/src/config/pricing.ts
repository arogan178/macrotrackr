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

export const PRICING_PLANS = {
  free: {
    name: "Free",
    features: [
      "Macro Tracking",
      "Meal Types",
      "Weight Logging",
      "Goal Setting",
      "Basic Reporting",
    ],
    price: "$0",
    suffix: "/forever",
    buttonText: "Get Started For Free",
    buttonVariant: "ghost",
    buttonClassName:
      "w-full bg-slate-700/50 hover:bg-slate-700 text-white border-2 border-indigo-500 hover:border-indigo-400 transition-all duration-300 text-xl px-12 py-4 font-semibold",
    featureIconColor: "text-green-400",
    featureTextClass: "text-slate-300",
    cardClassName: "",
    description: "Perfect for getting started",
  },
  pro: {
    name: "Pro",
    features: Array.from(
      new Set([
        ...[
          "Macro Tracking",
          "Meal Types",
          "Weight Logging",
          "Goal Setting",
          "Basic Reporting",
        ],
        "Unlimited Habit Tracking",
        "Recipe & Meal Saver",
        "Advanced Analytics",
        "Ad-Free Experience",
        "Priority Support",
        "Export Data",
      ])
    ),
    // price, suffix, equivalent, and buttonText will be set dynamically in the component
    price: PRICING.monthly,
    suffix: "/month",
    buttonText: "Get Pro Now",
    buttonVariant: "primary",
    buttonClassName:
      "w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl transition-all duration-300 text-xl px-12 py-4 font-semibold",
    featureIconColor: "text-indigo-400",
    featureTextClass: "text-white font-medium",
    cardClassName:
      "bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-600/50",
    isPopular: true,
    description: "Unlock your full potential",
  },
};
