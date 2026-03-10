import {
  FREE_PLAN_DEFINITION,
  PRICING,
  PRO_PLAN_DEFINITION,
} from "@shared/pricing";

export { PRICING };

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
    name: FREE_PLAN_DEFINITION.name,
    features: [...FREE_PLAN_DEFINITION.features],
    price: "$0",
    suffix: "/forever",
    buttonText: "Get Started For Free",
    buttonVariant: "ghost",
    buttonClassName:
      "w-full border border-border bg-surface-2 px-12 py-4 text-xl font-semibold text-foreground transition-[background-color,border-color,box-shadow] duration-300 hover:border-primary hover:bg-surface-3",
    featureIconColor: "text-primary",
    featureTextClass: "text-foreground",
    cardClassName: "bg-surface hover:bg-surface-2 transition-colors duration-300",
    description: FREE_PLAN_DEFINITION.description,
  },
  pro: {
    name: PRO_PLAN_DEFINITION.name,
    features: [...PRO_PLAN_DEFINITION.features],
    price: PRICING.monthly,
    suffix: "/month",
    buttonText: "Get Pro Now",
    buttonVariant: "primary",
    buttonClassName:
      "w-full bg-primary px-12 py-4 text-xl font-semibold shadow-success transition-[background-color,box-shadow,transform] duration-300 hover:bg-secondary",
    featureIconColor: "text-primary",
    featureTextClass: "text-foreground font-medium",
    cardClassName: "bg-surface-2 border-2 border-primary/40 shadow-success",
    isPopular: true,
    description: PRO_PLAN_DEFINITION.description,
  },
} satisfies Record<"free" | "pro", PricingPlan>;
