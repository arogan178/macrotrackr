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
  <div className="inline-flex bg-surface backdrop-blur-sm border border-border/50 rounded-2xl p-2">
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
      className="font-semibold relative"
    >
      Yearly
      <span className="absolute -top-2 -right-2 bg-success text-foreground text-xs px-2 py-1 rounded-full">
        Save 30%
      </span>
    </Button>
  </div>
);

export default PlanToggle;
