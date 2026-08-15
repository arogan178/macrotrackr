import {
  FREE_PLAN_DEFINITION,
  PRICING,
  PRO_PLAN_DEFINITION,
} from "@shared/pricing";



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
    buttonText: "Start free",
    buttonVariant: "ghost",
    buttonClassName:
      "w-full",
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
    buttonText: "Go Pro",
    buttonVariant: "primary",
    buttonClassName:
      "w-full",
    featureIconColor: "text-primary",
    featureTextClass: "text-foreground font-medium",
    cardClassName: "bg-surface-2 border-2 border-primary/40",
    isPopular: true,
    description: PRO_PLAN_DEFINITION.description,
  },
} satisfies Record<"free" | "pro", PricingPlan>;

export {PRICING} from "@shared/pricing";