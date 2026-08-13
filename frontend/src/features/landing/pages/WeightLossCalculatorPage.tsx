import { useState } from "react";

import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import { calculateBMR, calculateTDEE } from "@/utils/nutritionCalculations";
import { kgToLb, lbToKg } from "@/utils/unitConversion";
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
  calculatorStatLabelClass,
  calculatorStatRowClass,
  calculatorStatValueClass,
} from "../tools/calculatorStyles";
import ResultHeadline from "../tools/ResultHeadline";
import { useBodyStats } from "../tools/useBodyStats";

const FAQS = [
  {
    question: "How fast should I safely lose weight?",
    answer:
      "A safe and sustainable rate of fat loss is 0.5 to 1.0 kg (1 to 2 lbs) per week, which corresponds to a daily deficit of 500 to 1,000 calories.",
  },
  {
    question: "How many calories are in 1 kg of body fat?",
    answer:
      "1 kg of body fat contains approximately 7,700 calories (or ~3,500 calories per pound). A daily deficit of 500 calories creates a 3,500 calorie weekly deficit, yielding ~0.45 kg (1 lb) of fat loss per week.",
  },
  {
    question: "Why is eating too few calories counterproductive?",
    answer:
      "Severe calorie deficits trigger metabolic adaptation, extreme hunger, fatigue, and muscle degradation. Moderation preserves muscle tissue and metabolic rate.",
  },
];

// ~7,700 kcal per kg of body fat, spread across seven days.
const CALORIES_PER_KG_OF_FAT_PER_DAY = 1100;

const PACE_OPTIONS = [
  { value: "0.25", label: "Slow & Easy (0.25 kg / 0.55 lbs per week)" },
  { value: "0.5", label: "Recommended (0.5 kg / 1.1 lbs per week)" },
  { value: "0.75", label: "Faster Pace (0.75 kg / 1.65 lbs per week)" },
  { value: "1.0", label: "Aggressive (1.0 kg / 2.2 lbs per week)" },
];

export default function WeightLossCalculatorPage() {
  const stats = useBodyStats(85);
  const { weightKg, heightCm, age, gender, activityLevel, unitSystem } = stats;
  const statsReady = stats.ready;

  const [targetWeightKg, setTargetWeightKg] = useState(75);
  const [weeklyPaceKg, setWeeklyPaceKg] = useState(0.5);

  const bmr = statsReady ? calculateBMR(weightKg, heightCm, age, gender) : 0;
  const activityNumber = getActivityLevelFromString(activityLevel);
  const multiplier = getActivityLevelMultiplier(activityNumber);
  const tdee = calculateTDEE(bmr, multiplier);

  const hasTargetWeight = targetWeightKg > 0;
  const isLoss = hasTargetWeight && targetWeightKg < weightKg;
  const isGain = hasTargetWeight && targetWeightKg > weightKg;
  const isAtGoal = hasTargetWeight && !isLoss && !isGain;
  // Imperial input rounds to one decimal, so subtraction can leave float noise.
  const weightChangeKg =
    Math.round(Math.abs(weightKg - targetWeightKg) * 10) / 10;

  const dailyCalorieAdjustment = isAtGoal
    ? 0
    : Math.round(weeklyPaceKg * CALORIES_PER_KG_OF_FAT_PER_DAY);
  const targetCalories = isLoss
    ? Math.max(800, tdee - dailyCalorieAdjustment)
    : isGain
      ? tdee + dailyCalorieAdjustment
      : tdee;

  const estimatedWeeks =
    weeklyPaceKg > 0 && weightChangeKg > 0
      ? Math.ceil(weightChangeKg / weeklyPaceKg)
      : 0;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + estimatedWeeks * 7);
  const formattedDate = targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const minSafeCalories = gender === "female" ? 1200 : 1500;
  const isTooAggressive =
    statsReady && isLoss && targetCalories < minSafeCalories;

  return (
    <CalculatorLayout
      title="Weight Loss & Timeline Calculator"
      subtitle="Estimate a daily calorie target, a realistic pace, and a projected date for your goal weight."
      canonicalPath="/tools/weight-loss-calculator"
      description="Free Weight Loss Timeline Calculator. Estimate daily calorie deficit, weekly progress, and completion date for your target weight."
      faqs={FAQS}
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Form Inputs */}
        <div className="md:col-span-7 space-y-6">
          <div className={calculatorCardClass}>
            <h2 className={calculatorSectionTitleClass}>
              Current Stats & Activity
            </h2>
            <p className={`${calculatorSectionDescriptionClass} mb-5`}>
              Start with your current routine so the estimate has a useful
              baseline.
            </p>
            <BodyStatsForm stats={stats} showActivity />
          </div>

          <div className={`${calculatorCardClass} space-y-4`}>
            <h2 className={calculatorSectionTitleClass}>Goal & Pace</h2>
            <p className={calculatorSectionDescriptionClass}>
              A slower pace is usually easier to sustain and protect your
              energy.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {unitSystem === "imperial" ? (
                <NumberField
                  label="Target Weight"
                  value={kgToLb(targetWeightKg) || ""}
                  onChange={(v) =>
                    setTargetWeightKg(lbToKg(toNumericInput(v, 1000)))
                  }
                  min={30}
                  max={1000}
                  unit="lbs"
                />
              ) : (
                <NumberField
                  label="Target Weight"
                  value={targetWeightKg || ""}
                  onChange={(v) => setTargetWeightKg(toNumericInput(v, 500))}
                  min={15}
                  max={500}
                  unit="kg"
                />
              )}

              <Dropdown
                label="Weekly Pace"
                value={String(weeklyPaceKg)}
                onChange={(v) => setWeeklyPaceKg(Number(v))}
                options={PACE_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Output Card */}
        <div
          className={`${calculatorResultColumnClass} ${calculatorResultCardClass}`}
        >
          <ResultHeadline
            label="Target Daily Calories"
            value={targetCalories}
            unit="kcal / day"
            ready={statsReady}
          />

          {isTooAggressive && (
            <p
              role="status"
              className="mt-4 rounded-control border border-error/30 bg-error/10 p-3 text-sm leading-relaxed text-error"
            >
              This target is below the usual minimum of {minSafeCalories}{" "}
              kcal/day. Consider choosing a slower weekly pace.
            </p>
          )}

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            <div className={calculatorStatRowClass}>
              <dt className={calculatorStatLabelClass}>
                Maintenance burn (TDEE)
              </dt>
              <dd className={calculatorStatValueClass}>{tdee} kcal</dd>
            </div>
            <div className={calculatorStatRowClass}>
              <dt className={calculatorStatLabelClass}>
                Daily calorie {isGain ? "surplus" : "deficit"}
              </dt>
              <dd className={calculatorStatValueClass}>
                {isAtGoal
                  ? "0"
                  : `${isGain ? "+" : "-"}${dailyCalorieAdjustment}`}{" "}
                kcal
              </dd>
            </div>
            <div className={calculatorStatRowClass}>
              <dt className={calculatorStatLabelClass}>Total weight change</dt>
              <dd className={calculatorStatValueClass}>
                {unitSystem === "imperial"
                  ? `${kgToLb(weightChangeKg)} lbs`
                  : `${weightChangeKg} kg`}
              </dd>
            </div>
            <div className={calculatorStatRowClass}>
              <dt className={calculatorStatLabelClass}>Estimated duration</dt>
              <dd className={calculatorStatValueClass}>
                {estimatedWeeks === 0
                  ? "—"
                  : `${estimatedWeeks} ${estimatedWeeks === 1 ? "week" : "weeks"}`}
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-control border border-primary/25 bg-primary/10 p-4 text-center">
            <span className="block text-xs font-medium text-muted">
              {estimatedWeeks > 0 ? "Estimated goal date" : "Goal status"}
            </span>
            <span className="mt-1 block text-lg font-bold text-foreground">
              {estimatedWeeks > 0
                ? formattedDate
                : isAtGoal
                  ? "You're at your goal weight"
                  : "Set a target weight"}
            </span>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
