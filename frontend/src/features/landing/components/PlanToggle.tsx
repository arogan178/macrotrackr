import React from "react";
import { PRICING } from "@shared/pricing";

import { Button } from "@/components/ui";

interface PlanToggleProps {
  selectedPlan: "monthly" | "yearly";
  onSelect: (plan: "monthly" | "yearly") => void;
}

const yearlyDiscount = Math.round(
  (1 - PRICING.yearly / (PRICING.monthly * 12)) * 100,
);

/**
 * PlanToggle renders the monthly/yearly plan switch for pricing cards.
 * Usage example:
 *   <PlanToggle selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
 */
const PlanToggle: React.FC<PlanToggleProps> = ({ selectedPlan, onSelect }) => (
  <div className="inline-flex gap-1 rounded-control border border-border bg-surface-2 p-1.5">
    <Button
      type="button"
      onClick={() => onSelect("monthly")}
      variant={selectedPlan === "monthly" ? "primary" : "ghost"}
      buttonSize="md"
      aria-pressed={selectedPlan === "monthly"}
      className={`font-medium transition-colors ${selectedPlan === "monthly" ? "" : "hover:bg-surface-3"}`}
    >
      Monthly
    </Button>
    <Button
      type="button"
      onClick={() => onSelect("yearly")}
      variant={selectedPlan === "yearly" ? "primary" : "ghost"}
      buttonSize="md"
      aria-pressed={selectedPlan === "yearly"}
      className={`relative font-medium transition-colors ${selectedPlan === "yearly" ? "" : "hover:bg-surface-3"}`}
    >
      Yearly
      <span className="absolute -top-2.5 -right-3 rounded-control bg-success px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-background uppercase">
        Save {yearlyDiscount}%
      </span>
    </Button>
  </div>
);

export default PlanToggle;
