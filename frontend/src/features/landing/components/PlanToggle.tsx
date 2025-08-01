import React from "react";

import { Button } from "@/components/ui";

interface PlanToggleProps {
  selectedPlan: "monthly" | "yearly";
  onSelect: (plan: "monthly" | "yearly") => void;
}

/**
 * PlanToggle renders the monthly/yearly plan switch for pricing cards.
 * Usage example:
 *   <PlanToggle selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
 */
const PlanToggle: React.FC<PlanToggleProps> = ({ selectedPlan, onSelect }) => (
  <div className="inline-flex rounded-2xl border border-border/50 bg-surface p-2 backdrop-blur-sm">
    <Button
      type="button"
      onClick={() => onSelect("monthly")}
      variant={selectedPlan === "monthly" ? "primary" : "ghost"}
      buttonSize="md"
      aria-pressed={selectedPlan === "monthly"}
      className="font-semibold"
    >
      Monthly
    </Button>
    <Button
      type="button"
      onClick={() => onSelect("yearly")}
      variant={selectedPlan === "yearly" ? "primary" : "ghost"}
      buttonSize="md"
      aria-pressed={selectedPlan === "yearly"}
      className="relative font-semibold"
    >
      Yearly
      <span className="absolute -top-2 -right-2 rounded-full bg-success px-2 py-1 text-xs text-foreground">
        Save 30%
      </span>
    </Button>
  </div>
);

export default PlanToggle;
