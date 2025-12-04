// src/config/pricing.ts
// Centralized pricing configuration - keep in sync with frontend/src/config/pricing.ts

export const PRICING = {
  monthly: 3.99,
  yearly: 29.99,
} as const;

export const FREE_FEATURES = [
  "Macro Tracking",
  "Meal Types",
  "Weight Logging",
  "Goal Setting",
  "Basic Reporting",
] as const;

export const PRO_FEATURES = [
  ...FREE_FEATURES,
  "Unlimited Habit Tracking",
  "Recipe & Meal Saver",
  "Advanced Analytics",
  "Ad-Free Experience",
  "Priority Support",
  "Export Data",
] as const;

export interface Plan {
  id: "free" | "pro";
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: readonly string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started with macro tracking",
    price: 0,
    currency: "usd",
    interval: "month",
    features: FREE_FEATURES,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Unlock your full potential with advanced features",
    price: PRICING.monthly,
    currency: "usd",
    interval: "month",
    features: PRO_FEATURES,
  },
] as const;

export const getPlans = () => PLANS;
