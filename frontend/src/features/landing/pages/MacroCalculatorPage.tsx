import { useState } from "react";

import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import MacroSlider from "@/components/macros/MacroSlider";
import { COLOR_MAP } from "@/components/utils/UiConstants";
import type { MacroType } from "@/types/macro";
import {
  calculateBMR,
  calculateMacroTarget,
  calculateTDEE,
} from "@/utils/nutritionCalculations";
import {
  getActivityLevelFromString,
  getActivityLevelMultiplier,
} from "@/utils/userConstants";

import BodyStatsForm from "../tools/BodyStatsForm";
import { toNumericInput } from "../tools/calculatorInputs";
import CalculatorLayout from "../tools/CalculatorLayout";
import {
  calculatorCardClass,
  calculatorResultCardClass,
  calculatorResultColumnClass,
  calculatorSectionDescriptionClass,
  calculatorSectionTitleClass,
} from "../tools/calculatorStyles";
import { redistributeMacroPercentages } from "../tools/macroRedistribution";
import ResultHeadline from "../tools/ResultHeadline";
import { useBodyStats } from "../tools/useBodyStats";

const FAQS = [
  {
    question: "What is a macro split?",
    answer:
      "A macro split is the percentage breakdown of daily calories coming from Protein (4 kcal/g), Carbohydrates (4 kcal/g), and Fats (9 kcal/g).",
  },
  {
    question: "What is the best macro split for fat loss?",
    answer:
      "A common high-protein split for fat loss is 35% Protein / 35% Carbs / 30% Fats. High protein preserves lean muscle tissue while in a calorie deficit.",
  },
  {
    question: "What is the best macro split for muscle building?",
    answer:
      "For lean muscle gain, 30% Protein / 45% Carbs / 25% Fats works well. Higher carbs replenish glycogen stores and fuel intense workout performance.",
  },
];

const GOAL_OPTIONS = [
  { value: "lose", label: "Fat Loss (-500 kcal)" },
  { value: "maintain", label: "Maintenance (TDEE)" },
  { value: "gain", label: "Muscle Gain (+300 kcal)" },
  { value: "custom", label: "Custom Calorie Target" },
];

export default function MacroCalculatorPage() {
  const stats = useBodyStats();
  const { weightKg, heightCm, age, gender, activityLevel } = stats;
  const statsReady = stats.ready;

  const [goal, setGoal] = useState<"lose" | "maintain" | "gain" | "custom">(
    "lose",
  );
  const [customCalories, setCustomCalories] = useState(2000);

  const [percentages, setPercentages] = useState({
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  });
  const [lockedMacros, setLockedMacros] = useState<MacroType[]>([]);

  const bmr = statsReady ? calculateBMR(weightKg, heightCm, age, gender) : 0;
  const activityNumber = getActivityLevelFromString(activityLevel);
  const multiplier = getActivityLevelMultiplier(activityNumber);
  const tdee = calculateTDEE(bmr, multiplier);

  const totalCalories =
    goal === "custom"
      ? customCalories
      : goal === "lose"
        ? Math.max(1200, tdee - 500)
        : goal === "gain"
          ? tdee + 300
          : tdee;

  const macroGrams = calculateMacroTarget(
    totalCalories,
    percentages.proteinPercentage,
    percentages.carbsPercentage,
    percentages.fatsPercentage,
  );

  // A custom calorie target does not depend on the body stats above it.
  const resultReady = goal === "custom" || statsReady;

  const macroRows = [
    {
      macro: "protein" as MacroType,
      label: "Protein",
      grams: macroGrams.proteinTarget,
      percentage: percentages.proteinPercentage,
      calories: macroGrams.proteinTarget * 4,
    },
    {
      macro: "carbs" as MacroType,
      label: "Carbs",
      grams: macroGrams.carbsTarget,
      percentage: percentages.carbsPercentage,
      calories: macroGrams.carbsTarget * 4,
    },
    {
      macro: "fats" as MacroType,
      label: "Fats",
      grams: macroGrams.fatsTarget,
      percentage: percentages.fatsPercentage,
      calories: macroGrams.fatsTarget * 9,
    },
  ];

  const handleSliderChange = (macro: MacroType, newValue: number) => {
    setPercentages((prev) =>
      redistributeMacroPercentages(macro, newValue, prev, lockedMacros),
    );
  };

  const toggleLock = (macro: MacroType) => {
    setLockedMacros((prev) =>
      prev.includes(macro) ? prev.filter((m) => m !== macro) : [...prev, macro],
    );
  };

  return (
    <CalculatorLayout
      title="Macro Calculator"
      subtitle="Build a daily macronutrient target with adjustable protein, carbohydrate, and fat ratios."
      canonicalPath="/tools/macro-calculator"
      description="Free Flexible Macro Calculator. Customize your protein, carbohydrate, and fat percentage splits to hit your fitness goals."
      faqs={FAQS}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className={calculatorCardClass}>
            <h2 className={calculatorSectionTitleClass}>Body Stats & Goal</h2>
            <p className={`${calculatorSectionDescriptionClass} mb-5`}>
              Choose a goal to set calories, then fine-tune your split below.
            </p>
            <BodyStatsForm stats={stats} showActivity />

            <div className="mt-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
              <Dropdown
                label="Goal Preset"
                value={goal}
                onChange={(v) =>
                  setGoal(v as "lose" | "maintain" | "gain" | "custom")
                }
                options={GOAL_OPTIONS}
              />
              {goal === "custom" ? (
                <NumberField
                  label="Custom Daily Calories"
                  value={customCalories || ""}
                  onChange={(v) => setCustomCalories(toNumericInput(v, 10000))}
                  min={800}
                  max={10000}
                  unit="kcal"
                  maxDigits={5}
                />
              ) : (
                <p className="rounded-control border border-border bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
                  Based on your maintenance estimate of{" "}
                  <strong className="font-semibold text-foreground tabular-nums">
                    {tdee} kcal
                  </strong>
                  . Switch to a custom target to set calories yourself.
                </p>
              )}
            </div>
          </div>

          {/* Macro Sliders */}
          <div className={calculatorCardClass}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className={calculatorSectionTitleClass}>
                Macro Distribution Split
              </h2>
              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted tabular-nums">
                Total 100%
              </span>
            </div>
            <p className={`${calculatorSectionDescriptionClass} mb-6`}>
              Moving one slider rebalances the others. Lock a macro to hold it
              in place.
            </p>
            <div className="space-y-6">
              <MacroSlider
                name="Protein"
                color="protein"
                value={percentages.proteinPercentage}
                onChange={(val) => handleSliderChange("protein", val)}
                isLocked={lockedMacros.includes("protein")}
                onToggleLock={() => toggleLock("protein")}
              />
              <MacroSlider
                name="Carbs"
                color="carbs"
                value={percentages.carbsPercentage}
                onChange={(val) => handleSliderChange("carbs", val)}
                isLocked={lockedMacros.includes("carbs")}
                onToggleLock={() => toggleLock("carbs")}
              />
              <MacroSlider
                name="Fats"
                color="fats"
                value={percentages.fatsPercentage}
                onChange={(val) => handleSliderChange("fats", val)}
                isLocked={lockedMacros.includes("fats")}
                onToggleLock={() => toggleLock("fats")}
              />
            </div>
          </div>
        </div>

        {/* Right Output Card */}
        <div
          className={`${calculatorResultColumnClass} ${calculatorResultCardClass}`}
        >
          <ResultHeadline
            label="Daily Target Summary"
            value={totalCalories}
            unit="kcal / day"
            ready={resultReady}
          />

          <ul className="mt-8 space-y-3 border-t border-border pt-6">
            {macroRows.map((row) => (
              <li
                key={row.macro}
                className="rounded-control border border-border bg-surface-2 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${COLOR_MAP[row.macro].dot}`}
                      aria-hidden="true"
                    />
                    {row.label}
                  </span>
                  <span className="text-muted tabular-nums">
                    {row.percentage}% · {row.calories} kcal
                  </span>
                </div>
                <div className="text-xl font-extrabold text-foreground tabular-nums">
                  {row.grams}g
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-muted">
            Protein and carbs provide 4 calories per gram. Fat provides 9.
          </p>
        </div>
      </div>
    </CalculatorLayout>
  );
}
