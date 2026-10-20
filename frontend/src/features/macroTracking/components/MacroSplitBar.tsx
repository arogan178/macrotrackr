import { cn } from "@/lib/classnameUtilities";

import {
  calculateCarbsCalories,
  calculateFatsCalories,
  calculateProteinCalories,
} from "../calculations";

interface MacroSplitBarProps {
  protein: number;
  carbs: number;
  fats: number;
  className?: string;
}

/**
 * Where a food's calories come from, as one thin bar: a protein-heavy meal is
 * mostly green before its grams are read. Shares are by calories, not grams,
 * so fat counts at 9 kcal a gram.
 */
export function MacroSplitBar({ protein, carbs, fats, className }: MacroSplitBarProps) {
  const parts = [
    { key: "protein", kcal: calculateProteinCalories(protein), fill: "bg-protein" },
    { key: "carbs", kcal: calculateCarbsCalories(carbs), fill: "bg-carbs" },
    { key: "fats", kcal: calculateFatsCalories(fats), fill: "bg-fats" },
  ];
  const total = parts.reduce((sum, part) => sum + part.kcal, 0);

  return (
    <span
      aria-hidden
      className={cn("flex h-1 w-full overflow-hidden rounded-full bg-foreground/8", className)}
    >
      {total > 0 &&
        parts.map((part) => (
          <span
            key={part.key}
            className={cn("h-full", part.fill)}
            style={{ width: `${(part.kcal / total) * 100}%` }}
          />
        ))}
    </span>
  );
}
