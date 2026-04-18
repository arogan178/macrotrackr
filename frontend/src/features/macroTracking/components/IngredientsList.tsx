import { motion } from "motion/react";

import { MacroCell } from "@/components/macros/MacroComponents";
import type { Ingredient } from "@/types/macro";

interface IngredientRowProps {
  ingredient: Ingredient;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
}

export function IngredientRow({
  ingredient,
  calculateCalories,
}: IngredientRowProps) {
  return (
    <div className="flex items-center text-xs text-muted">
      <div className="flex-1 font-medium text-foreground">
        {ingredient.name}{" "}
        {ingredient.quantity
          ? `(${ingredient.quantity}${ingredient.unit ?? ""})`
          : ""}
      </div>
      <div className="w-[14%] text-center">
        <MacroCell value={ingredient.protein} suffix="g" color="text-protein" />
      </div>
      <div className="w-[14%] text-center">
        <MacroCell value={ingredient.carbs} suffix="g" color="text-carbs" />
      </div>
      <div className="w-[14%] text-center">
        <MacroCell value={ingredient.fats} suffix="g" color="text-fats" />
      </div>
      <div className="w-[14%] text-center">
        <MacroCell
          value={calculateCalories(
            ingredient.protein,
            ingredient.carbs,
            ingredient.fats,
          )}
          suffix=" kcal"
          color="text-foreground"
        />
      </div>
      <div className="w-[14%]" />
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
      className="w-full overflow-hidden border-t border-border/40 bg-surface-2/40"
    >
      <div className="flex flex-col gap-2 px-[10%] py-3">
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
