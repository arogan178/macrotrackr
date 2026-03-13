import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { PRICING, PRICING_PLANS } from "@/config/pricing";
import { useStore } from "@/store/store";

import PlanToggle from "./PlanToggle";
import PricingCard from "./PricingCard";
import TrustIndicators from "./TrustIndicators";

interface CustomPricingCardsProps {
  onUpgrade?: (plan: "monthly" | "yearly") => void;
  showUpgradeButtons?: boolean;
}

const CustomPricingCards: React.FC<CustomPricingCardsProps> = ({
  onUpgrade,
  showUpgradeButtons = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const isAuthenticated = !!isSignedIn;
  const subscriptionStatus = useStore((s) => s.subscriptionStatus);
  const isProUser = subscriptionStatus === "pro" || subscriptionStatus === "canceled";
  const posthog = usePostHog();

  const handleGetPro = () => {
    if (isAuthenticated) {
      // If user is logged in, go to pricing page
      posthog?.capture?.("clicked_pricing_nav", {
        location: "pricing_cards",
        source: "pricing_card_pro",
      });
      navigate({ to: "/pricing" });
    } else {
      // If user is not logged in, go to register and include a returnTo so
      // after signup/login the user can be redirected back to /pricing.
      posthog?.capture?.("clicked_pricing_nav", {
        location: "pricing_cards",
        source: "pricing_card_pro_unauth",
      });
      try {
        navigate({ to: "/register", search: { returnTo: "/pricing" } });
      } catch {
        // Fallback to full navigation
        globalThis.location.href = "/register?returnTo=/pricing";
      }
    }
  };

  // Use centralized config for features and static plan data
  const features = {
    free: PRICING_PLANS.free.features,
    pro: PRICING_PLANS.pro.features,
  };

  const proPrice =
    selectedPlan === "monthly" ? PRICING.monthly : PRICING.yearly;
  const proSuffix = selectedPlan === "monthly" ? "/month" : "/year";
  const proEquivalent =
    selectedPlan === "yearly"
      ? `($${(PRICING.yearly / 12).toFixed(2)}/month)`
      : "";

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Plan Toggle */}
      <div className="mb-12 flex justify-center">
        <PlanToggle selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Free Plan */}
        <PricingCard
          title={PRICING_PLANS.free.name}
          price={PRICING_PLANS.free.price}
          suffix={PRICING_PLANS.free.suffix}
          features={features.free}
          buttonText={
            isProUser ? "Free Plan" : isAuthenticated ? "Current Plan" : "Create Free Account"
          }
          buttonVariant="ghost"
          buttonSize="lg"
          buttonClassName="w-full rounded-full border border-border bg-surface-2 transition-colors duration-200 hover:border-border-2 hover:bg-surface-3 hover:text-foreground"
          featureIconColor="text-primary/70"
          featureTextClass="text-muted"
          cardClassName="border-border bg-surface hover:border-border-2"
          buttonDisabled={isAuthenticated}
          onButtonClick={
            isAuthenticated
              ? undefined
              : () => {
                  posthog?.capture?.("clicked_pricing_nav", {
                    location: "pricing_cards",
                    source: "pricing_card_free",
                  });
                  navigate({ to: "/register", search: { returnTo: undefined } });
                }
          }
        >
          <p className="mt-2 text-balance text-muted">
            Everything you need to start tracking and build lasting healthy habits.
          </p>
        </PricingCard>

        {/* Pro Plan */}
        <PricingCard
          title={PRICING_PLANS.pro.name}
          price={
            <AnimatedNumber
              value={proPrice}
              toFixedValue={2}
              prefix="$"
              suffix={proSuffix}
            />
          }
          suffix=""
          equivalent={proEquivalent}
          features={features.pro}
          isPopular={true}
          buttonText={
            isProUser
              ? "Current Plan"
              : showUpgradeButtons
                ? "Upgrade to Pro"
                : "Unlock Pro"
          }
          buttonVariant="primary"
          buttonSize="lg"
          buttonClassName="w-full rounded-full font-semibold transition-colors duration-200 hover:bg-primary/90"
          featureIconColor="text-primary"
          featureTextClass="text-foreground font-medium"
          cardClassName="border-border-2 bg-surface-2 hover:border-primary/50"
          buttonDisabled={isProUser}
          onButtonClick={
            isProUser
              ? undefined
              : showUpgradeButtons
                ? () => onUpgrade?.(selectedPlan)
                : handleGetPro
          }
        >
          <p className="mt-2 text-balance text-muted">
            Unlock advanced analytics, custom insights, and tools to accelerate your results.
          </p>
        </PricingCard>
      </div>

      {/* Enhanced Trust Indicators */}
      <TrustIndicators />
    </div>
  );
};

export default CustomPricingCards;
