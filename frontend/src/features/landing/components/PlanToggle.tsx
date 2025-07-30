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
  <div className="inline-flex bg-surface/60 backdrop-blur-sm border border-border/50 rounded-2xl p-2">
    <Button
      type="button"
      onClick={() => onSelect("monthly")}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
        selectedPlan === "monthly"
          ? "bg-primary text-foreground shadow-primary"
          : "text-foreground hover:text-foreground"
      }`}
      aria-pressed={selectedPlan === "monthly"}
      variant={selectedPlan === "monthly" ? undefined : "ghost"}
    >
      Monthly
    </Button>
    <Button
      type="button"
      onClick={() => onSelect("yearly")}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
        selectedPlan === "yearly"
          ? "bg-primary text-foreground shadow-primary"
          : "text-foreground hover:text-foreground"
      }`}
      aria-pressed={selectedPlan === "yearly"}
      variant={selectedPlan === "yearly" ? undefined : "ghost"}
    >
      Yearly
      <span className="absolute -top-2 -right-2 bg-success text-foreground text-xs px-2 py-1 rounded-full">
        Save 30%
      </span>
    </Button>
  </div>
);

export default PlanToggle;
