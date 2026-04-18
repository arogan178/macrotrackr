import {
  FREE_PLAN_DEFINITION,
  PRICING,
  PRO_PLAN_DEFINITION,
} from "@shared/pricing";

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
    name: FREE_PLAN_DEFINITION.name,
    description: FREE_PLAN_DEFINITION.description,
    price: 0,
    currency: "usd",
    interval: "month",
    features: FREE_PLAN_DEFINITION.features,
  },
  {
    id: "pro",
    name: PRO_PLAN_DEFINITION.name,
    description: PRO_PLAN_DEFINITION.description,
    price: PRICING.monthly,
    currency: "usd",
    interval: "month",
    features: PRO_PLAN_DEFINITION.features,
  },
] as const;

export const getPlans = () => PLANS;
