import { motion } from "motion/react";

import Value from "@/components/ui/Value";
import { cn } from "@/lib/classnameUtilities";
import type { Ingredient } from "@/types/macro";

import { DESKTOP_ROW_GRID } from "./EntryHistoryShared";
import { MacroSplitBar } from "./MacroSplitBar";

interface IngredientRowProps {
  ingredient: Ingredient;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
}

export function IngredientRow({
  ingredient,
  calculateCalories,
}: IngredientRowProps) {
  return (
    <div className={cn(DESKTOP_ROW_GRID, "text-xs text-muted")}>
      <div className="min-w-0 truncate pl-6 text-foreground">
        {ingredient.name}
        {ingredient.quantity ? ` (${ingredient.quantity}${ingredient.unit ?? ""})` : ""}
      </div>
      <MacroSplitBar
        protein={ingredient.protein}
        carbs={ingredient.carbs}
        fats={ingredient.fats}
      />
      <Value value={ingredient.protein} unit="g" className="justify-self-end text-muted" />
      <Value value={ingredient.carbs} unit="g" className="justify-self-end text-muted" />
      <Value value={ingredient.fats} unit="g" className="justify-self-end text-muted" />
      <Value
        value={calculateCalories(ingredient.protein, ingredient.carbs, ingredient.fats)}
        unit="kcal"
        className="justify-self-end text-muted"
      />
      <span />
    </div>
  );
}

interface IngredientsListProps {
  ingredients: Ingredient[];
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
}

export function IngredientsList({
  ingredients,
  calculateCalories,
}: IngredientsListProps) {
  if (!ingredients || ingredients.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2 },
      }}
      className="w-full overflow-hidden"
    >
      <div className="flex flex-col gap-2 pb-3">
        {ingredients.map((ing, index) => (
          <IngredientRow
            key={index}
            ingredient={ing}
            calculateCalories={calculateCalories}
          />
        ))}
      </div>
    </motion.div>
  );
}
