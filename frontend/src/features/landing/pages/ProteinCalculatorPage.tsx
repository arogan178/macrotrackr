import { useState } from "react";

import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import { kgToLb } from "@/utils/unitConversion";

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
    question: "How much protein do I need per day?",
    answer:
      "General healthy adults need 1.2–1.6g per kg of body weight. Active individuals training with resistance or in a calorie deficit benefit from 1.6–2.4g per kg (0.8–1.1g per lb) to build and retain muscle.",
  },
  {
    question: "Is high protein intake safe for healthy kidneys?",
    answer:
      "Yes. Research consistently shows high protein diets (up to 3.3g/kg per day) are completely safe for healthy adults without pre-existing kidney conditions.",
  },
  {
    question: "How much protein can the body absorb in one meal?",
    answer:
      "Your digestive system can absorb virtually all protein eaten in a meal. However, muscle protein synthesis peaks around 30–50g of high-quality protein per meal.",
  },
];

const TRAINING_GOAL_OPTIONS = [
  {
    value: "1.2",
    label: "Sedentary / Maintenance (1.2g per kg / ~0.55g per lb)",
  },
  {
    value: "1.6",
    label: "Active / Endurance (1.6g per kg / ~0.73g per lb)",
  },
  {
    value: "2.2",
    label: "Strength / Muscle Building (2.2g per kg / ~1.00g per lb)",
  },
  {
    value: "2.4",
    label: "Fat Loss Deficit / Cut (2.4g per kg / ~1.10g per lb)",
  },
];

const HIGH_PROTEIN_FOODS = [
  {
    name: "Chicken Breast (Cooked)",
    serving: "100g",
    protein: "31g",
    cals: "165",
  },
  {
    name: "Greek Yogurt (Non-fat)",
    serving: "200g",
    protein: "20g",
    cals: "120",
  },
  { name: "Salmon (Cooked)", serving: "100g", protein: "25g", cals: "206" },
  { name: "Whey Protein Scoop", serving: "30g", protein: "24g", cals: "120" },
  {
    name: "Cottage Cheese (Low-fat)",
    serving: "150g",
    protein: "18g",
    cals: "125",
  },
  { name: "Whole Eggs", serving: "3 large", protein: "18g", cals: "210" },
  { name: "Extra Firm Tofu", serving: "150g", protein: "15g", cals: "120" },
  { name: "Cooked Lentils", serving: "200g", protein: "18g", cals: "230" },
];

export default function ProteinCalculatorPage() {
  const stats = useBodyStats();
  const { weightKg } = stats;

  const [proteinRatio, setProteinRatio] = useState(2.2);
  const [mealsPerDay, setMealsPerDay] = useState(4);

  const weightReady = weightKg > 0;
  const totalProteinGrams = Math.round(weightKg * proteinRatio);
  const safeMealsPerDay = Math.max(1, mealsPerDay);
  const perMealGrams = Math.round(totalProteinGrams / safeMealsPerDay);
  const gramsPerLb = weightReady
    ? (totalProteinGrams / kgToLb(weightKg)).toFixed(2)
    : "0.00";

  return (
    <CalculatorLayout
      title="Protein Intake Calculator"
      subtitle="Estimate a practical daily protein target for muscle building, fat loss, or endurance training."
      canonicalPath="/tools/protein-calculator"
      description="Free Protein Intake Calculator. Calculate exact daily grams of protein and per-meal targets tailored to your weight and fitness goals."
      faqs={FAQS}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className={calculatorCardClass}>
            <h2 className={calculatorSectionTitleClass}>
              Body Stats & Fitness Goal
            </h2>
            <p className={`${calculatorSectionDescriptionClass} mb-5`}>
              Pick the training context that best matches your current routine.
            </p>
            <BodyStatsForm stats={stats} />

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Dropdown
                label="Training & Activity Goal"
                value={String(proteinRatio)}
                onChange={(v) => setProteinRatio(Number(v))}
                options={TRAINING_GOAL_OPTIONS}
              />

              <NumberField
                label="Meals per Day"
                value={mealsPerDay || ""}
                onChange={(v) => setMealsPerDay(toNumericInput(v, 8))}
                min={1}
                max={8}
                unit="meals"
                maxDigits={1}
              />
            </div>
          </div>
        </div>

        {/* Output Card */}
        <div
          className={`${calculatorResultColumnClass} ${calculatorResultCardClass}`}
        >
          <ResultHeadline
            label="Recommended Daily Protein"
            value={totalProteinGrams}
            unit="grams / day"
            ready={weightReady}
            hint="Add your weight to see your protein target."
          />

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            <div className={calculatorStatRowClass}>
              <dt className={calculatorStatLabelClass}>Target per meal</dt>
              <dd className={calculatorStatValueClass}>~{perMealGrams}g</dd>
            </div>
            <div className={calculatorStatRowClass}>
              <dt className={calculatorStatLabelClass}>
                Protein per body weight
              </dt>
              <dd className={calculatorStatValueClass}>
                {proteinRatio} g/kg ({gramsPerLb} g/lb)
              </dd>
            </div>
            <div className={calculatorStatRowClass}>
              <dt className={calculatorStatLabelClass}>
                Total calories from protein
              </dt>
              <dd className={calculatorStatValueClass}>
                {totalProteinGrams * 4} kcal
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-sm leading-relaxed text-muted">
            Spread across {safeMealsPerDay}{" "}
            {safeMealsPerDay === 1 ? "meal" : "meals"}, that is roughly{" "}
            {perMealGrams}g of protein each time you eat.
          </p>
        </div>
      </div>

      {/* Protein Source Reference Table */}
      <div className={`mt-12 ${calculatorCardClass}`}>
        <h2 className="mb-1 text-xl font-bold tracking-tight text-foreground">
          High-Protein Food Ideas
        </h2>
        <p className="mb-4 text-sm text-muted">
          Use these as quick reference points when planning meals.
        </p>
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-100 text-left text-xs text-muted">
            <thead className="border-b border-border uppercase tracking-wider text-foreground">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Food item
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Serving
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-right font-semibold"
                >
                  Protein
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-right font-semibold"
                >
                  Calories
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {HIGH_PROTEIN_FOODS.map((item) => (
                <tr
                  key={item.name}
                  className="transition-colors hover:bg-surface-2"
                >
                  <th
                    scope="row"
                    className="px-3 py-2.5 text-left font-semibold text-foreground"
                  >
                    {item.name}
                  </th>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {item.serving}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-foreground tabular-nums">
                    {item.protein}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                    {item.cals} kcal
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CalculatorLayout>
  );
}
