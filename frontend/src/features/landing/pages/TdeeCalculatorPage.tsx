import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { formatGrouped } from "@/lib/formatNumber";
import {
  calculateBMR,
  calculateMacroTarget,
  calculateTDEE,
} from "@/utils/nutritionCalculations";
import {
  ACTIVITY_LEVELS,
  getActivityLevelFromString,
  getActivityLevelMultiplier,
} from "@/utils/userConstants";

import BodyStatsForm from "../tools/BodyStatsForm";
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

const GOAL_SPLIT = { protein: 30, carbs: 40, fats: 30 } as const;

export default function TdeeCalculatorPage() {
  const stats = useBodyStats();
  const { weightKg, heightCm, age, gender, activityLevel, setActivityLevel } =
    stats;
  const statsReady = stats.ready;

  const bmr = statsReady ? calculateBMR(weightKg, heightCm, age, gender) : 0;
  const activityNumber = getActivityLevelFromString(activityLevel);
  const multiplier = getActivityLevelMultiplier(activityNumber);
  const tdee = calculateTDEE(bmr, multiplier);

  const goalCards = [
    {
      key: "lose",
      label: "Fat Loss",
      accentClass: "text-primary",
      delta: "-500 kcal/day",
      calories: Math.max(1200, tdee - 500),
    },
    {
      key: "maintain",
      label: "Maintenance",
      accentClass: "text-primary",
      delta: "Match your burn",
      calories: tdee,
      highlighted: true,
    },
    {
      key: "gain",
      label: "Muscle Gain",
      accentClass: "text-success",
      delta: "+300 kcal/day",
      calories: tdee + 300,
    },
  ].map((goal) => ({
    ...goal,
    macros: calculateMacroTarget(
      goal.calories,
      GOAL_SPLIT.protein,
      GOAL_SPLIT.carbs,
      GOAL_SPLIT.fats,
    ),
  }));

  return (
    <CalculatorLayout
      title="TDEE Calculator"
      subtitle="Estimate your Total Daily Energy Expenditure and explore calorie targets for fat loss, maintenance, or muscle gain."
      canonicalPath="/tools/tdee-calculator"
      shareInputs={stats.shareInputs}
      ctaResult={
        statsReady
          ? {
              label: "Your TDEE",
              value: `${formatGrouped(tdee)} kcal / day`,
            }
          : undefined
      }
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Form Inputs */}
        <div className={`md:col-span-7 ${calculatorCardClass}`}>
          <h2 className={calculatorSectionTitleClass}>
            Your Body Stats & Activity
          </h2>
          <p className={`${calculatorSectionDescriptionClass} mb-5`}>
            Your maintenance estimate updates as you adjust these details.
          </p>
          <BodyStatsForm stats={stats} showActivity />
        </div>

        {/* TDEE Summary Card */}
        <div
          className={`${calculatorResultColumnClass} ${calculatorResultCardClass}`}
        >
          <ResultHeadline
            label="Maintenance Calories (TDEE)"
            value={tdee}
            unit="kcal / day"
            ready={statsReady}
          />
          {statsReady ? (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Your Basal Metabolic Rate (BMR) is{" "}
              <strong className="text-foreground">
                {formatGrouped(bmr)} kcal
              </strong>
              . Activity adds{" "}
              <strong className="text-foreground">
                {formatGrouped(tdee - bmr)} kcal
              </strong>
              .
            </p>
          ) : null}

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Activity Breakdown
            </h3>
            <p className="mt-1 mb-3 text-xs leading-relaxed text-muted">
              Tap a level to see how it changes your maintenance calories.
            </p>
            <ul className="space-y-2">
              {Object.values(ACTIVITY_LEVELS).map((level) => {
                const isSelected = level.value === activityLevel;

                return (
                  <li key={level.value}>
                    <button
                      type="button"
                      onClick={() => setActivityLevel(level.value)}
                      aria-pressed={isSelected}
                      className={`grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-control border px-3 py-2.5 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
                        isSelected
                          ? "border-primary/30 bg-primary/10 font-semibold text-foreground"
                          : "border-transparent text-muted hover:bg-surface-2 hover:text-foreground"
                      }`}
                    >
                      <span className="leading-snug">{level.label}</span>
                      <span className="whitespace-nowrap font-medium tabular-nums">
                        {formatGrouped(bmr * level.multiplier)} kcal
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Goal Targets */}
      <div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
          Calorie & Macro Targets by Goal
        </h2>
        <p className="mx-auto mt-2 mb-6 max-w-xl text-center text-sm leading-relaxed text-muted">
          Each target uses a balanced {GOAL_SPLIT.protein}/{GOAL_SPLIT.carbs}/
          {GOAL_SPLIT.fats} protein, carb, and fat split.
        </p>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {goalCards.map((goal) => (
            <li
              key={goal.key}
              className={`${calculatorCardClass} ${
                goal.highlighted ? "border-primary/30 bg-primary/[0.06]" : ""
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${goal.accentClass}`}
                >
                  {goal.label}
                </span>
                <span className="text-xs whitespace-nowrap text-muted">
                  {goal.delta}
                </span>
              </div>
              <div className="mb-4 text-3xl font-extrabold text-foreground tabular-nums">
                <AnimatedNumber value={goal.calories} />{" "}
                <span className="text-sm font-normal text-muted">kcal</span>
              </div>
              <dl className="space-y-2 border-t border-border pt-4 text-xs">
                <div className={calculatorStatRowClass}>
                  <dt className={calculatorStatLabelClass}>
                    Protein · {GOAL_SPLIT.protein}%
                  </dt>
                  <dd className={calculatorStatValueClass}>
                    {goal.macros.proteinTarget}g
                  </dd>
                </div>
                <div className={calculatorStatRowClass}>
                  <dt className={calculatorStatLabelClass}>
                    Carbs · {GOAL_SPLIT.carbs}%
                  </dt>
                  <dd className={calculatorStatValueClass}>
                    {goal.macros.carbsTarget}g
                  </dd>
                </div>
                <div className={calculatorStatRowClass}>
                  <dt className={calculatorStatLabelClass}>
                    Fats · {GOAL_SPLIT.fats}%
                  </dt>
                  <dd className={calculatorStatValueClass}>
                    {goal.macros.fatsTarget}g
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </CalculatorLayout>
  );
}
