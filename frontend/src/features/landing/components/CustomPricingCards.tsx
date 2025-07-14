import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

import { BUTTON_SIZES } from "@/components/utils/Constants";
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
  const isAuthenticated = useStore((state) => state.auth.isAuthenticated);

  const handleGetPro = () => {
    if (isAuthenticated) {
      // If user is logged in, go to pricing page
      navigate({ to: "/pricing" });
    } else {
      // If user is not logged in, go to register
      navigate({ to: "/register" });
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
    <div className="w-full max-w-6xl mx-auto">
      {/* Plan Toggle */}
      <div className="flex justify-center mb-12">
        <PlanToggle selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Free Plan */}
        <PricingCard
          title={PRICING_PLANS.free.name}
          price={PRICING_PLANS.free.price}
          suffix={PRICING_PLANS.free.suffix}
          features={features.free}
          buttonText={PRICING_PLANS.free.buttonText}
          buttonVariant={PRICING_PLANS.free.buttonVariant}
          buttonSize={BUTTON_SIZES.LG}
          buttonClassName={PRICING_PLANS.free.buttonClassName}
          tabIndex={0}
          focusRingColor="focus:ring-indigo-500/40"
          featureIconColor={PRICING_PLANS.free.featureIconColor}
          featureTextClass={PRICING_PLANS.free.featureTextClass}
          cardClassName={PRICING_PLANS.free.cardClassName}
        >
          <p className="text-slate-400">{PRICING_PLANS.free.description}</p>
        </PricingCard>

        {/* Pro Plan */}
        <PricingCard
          title={PRICING_PLANS.pro.name}
          price={
            <AnimatePresence mode="wait">
              <motion.span
                key={selectedPlan}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                ${proPrice}
              </motion.span>
            </AnimatePresence>
          }
          suffix={proSuffix}
          equivalent={proEquivalent}
          features={features.pro}
          isPopular={PRICING_PLANS.pro.isPopular}
          buttonText={
            showUpgradeButtons ? "Upgrade to Pro" : PRICING_PLANS.pro.buttonText
          }
          buttonVariant={PRICING_PLANS.pro.buttonVariant}
          buttonSize={BUTTON_SIZES.LG}
          buttonClassName={PRICING_PLANS.pro.buttonClassName}
          tabIndex={0}
          focusRingColor="focus:ring-indigo-500/40"
          featureIconColor={PRICING_PLANS.pro.featureIconColor}
          featureTextClass={PRICING_PLANS.pro.featureTextClass}
          cardClassName={PRICING_PLANS.pro.cardClassName}
          onButtonClick={
            showUpgradeButtons
              ? () => onUpgrade && onUpgrade(selectedPlan)
              : handleGetPro
          }
        >
          <p className="text-slate-400 mt-2">{PRICING_PLANS.pro.description}</p>
        </PricingCard>
      </div>

      {/* Enhanced Trust Indicators */}
      <TrustIndicators />
    </div>
  );
};

export default CustomPricingCards;
