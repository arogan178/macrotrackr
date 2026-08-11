import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { ArrowRightIcon } from "@/components/ui";
import { calculateBMR } from "@/utils/nutritionCalculations";
import { ACTIVITY_LEVELS } from "@/utils/userConstants";

import BodyStatsForm from "../tools/BodyStatsForm";
import CalculatorLayout from "../tools/CalculatorLayout";
import {
  calculatorCardClass,
  calculatorResultCardClass,
  calculatorResultColumnClass,
  calculatorSectionDescriptionClass,
  calculatorSectionTitleClass,
} from "../tools/calculatorStyles";
import ResultHeadline from "../tools/ResultHeadline";
import { useBodyStats } from "../tools/useBodyStats";

const FAQS = [
  {
    question: "What is Basal Metabolic Rate (BMR)?",
    answer:
      "BMR is the number of calories your body burns at rest to maintain essential life functions like breathing, circulation, cell production, and temperature regulation.",
  },
  {
    question: "What is the difference between BMR and TDEE?",
    answer:
      "BMR is your baseline resting energy burn. TDEE (Total Daily Energy Expenditure) includes your BMR plus the calories burned through movement, exercise, and digesting food.",
  },
  {
    question: "Which formula does this calculator use?",
    answer:
      "This calculator uses the Mifflin-St Jeor equation, widely recognized in clinical research as the most accurate formula for estimating resting metabolic rate.",
  },
  {
    question: "Should I eat less than my BMR?",
    answer:
      "Generally no. Eating below your BMR for extended periods can cause muscle loss, nutrient deficiencies, low energy levels, and hormonal disruption. Aim to eat between your BMR and TDEE for weight loss.",
  },
];

export default function BmrCalculatorPage() {
  const stats = useBodyStats();
  const { weightKg, heightCm, age, gender } = stats;
  const statsReady = stats.ready;

  const bmr = statsReady ? calculateBMR(weightKg, heightCm, age, gender) : 0;

  return (
    <CalculatorLayout
      title="BMR Calculator"
      subtitle="Estimate the calories your body uses at complete rest to keep essential functions running."
      canonicalPath="/tools/bmr-calculator"
      description="Free Basal Metabolic Rate (BMR) calculator using the Mifflin-St Jeor equation. Calculate your baseline calories burned at rest."
      faqs={FAQS}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Form Inputs */}
        <div className={`lg:col-span-7 ${calculatorCardClass}`}>
          <h2 className={calculatorSectionTitleClass}>Your Body Stats</h2>
          <p className={`${calculatorSectionDescriptionClass} mb-5`}>
            We use the Mifflin-St Jeor equation for this estimate.
          </p>
          <BodyStatsForm stats={stats} />
        </div>

        {/* BMR Output Card */}
        <div
          className={`${calculatorResultColumnClass} ${calculatorResultCardClass}`}
        >
          <ResultHeadline
            label="Your Resting Burn"
            value={bmr}
            unit="kcal / day"
            ready={statsReady}
          />
          {statsReady ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This is the energy your body uses for essential functions before
              movement, exercise, and digestion.
            </p>
          ) : null}

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Estimated Burn by Activity
            </h3>
            <p className="mt-1 mb-3 text-xs leading-relaxed text-muted">
              Layer daily movement on top to approximate a full day of burn.
            </p>
            <ul className="space-y-2">
              {Object.values(ACTIVITY_LEVELS).map((level) => (
                <li
                  key={level.value}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/50 px-3 py-2.5 text-xs"
                >
                  <span className="truncate font-medium text-muted">
                    {level.label}
                  </span>
                  <span className="whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1 font-semibold text-foreground tabular-nums">
                    {Math.round(bmr * level.multiplier)} kcal
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/tools/tdee-calculator"
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-xs font-semibold text-primary transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              Get a full TDEE breakdown
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
