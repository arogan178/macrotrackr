import React from "react";

import FormButton from "@/components/form/FormButton";

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
  <div className="inline-flex bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-2">
    <FormButton
      type="button"
      onClick={() => onSelect("monthly")}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
        selectedPlan === "monthly"
          ? "bg-indigo-600 text-white shadow-lg"
          : "text-slate-400 hover:text-slate-300"
      }`}
      aria-pressed={selectedPlan === "monthly"}
      variant={selectedPlan === "monthly" ? undefined : "ghost"}
    >
      Monthly
    </FormButton>
    <FormButton
      type="button"
      onClick={() => onSelect("yearly")}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
        selectedPlan === "yearly"
          ? "bg-indigo-600 text-white shadow-lg"
          : "text-slate-400 hover:text-slate-300"
      }`}
      aria-pressed={selectedPlan === "yearly"}
      variant={selectedPlan === "yearly" ? undefined : "ghost"}
    >
      Yearly
      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
        Save 30%
      </span>
    </FormButton>
  </div>
);

export default PlanToggle;
