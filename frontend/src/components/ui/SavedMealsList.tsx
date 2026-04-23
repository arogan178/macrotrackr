import { memo } from "react";
import { motion } from "motion/react";

import { isLocalAuthMode } from "@/config/runtime";
import { calculateCaloriesFromMacros } from "@/features/macroTracking/calculations";
import { useDeleteSavedMeal, useSavedMeals } from "@/hooks/queries/useSavedMeals";
import { cn } from "@/lib/classnameUtilities";
import type { Ingredient } from "@/types/macro";

import Button from "./Button";
import { TrashIcon } from "./Icons";

interface SavedMealsListProps {
  onSelectMeal: (meal: {
    name: string;
    protein: number;
    carbs: number;
    fats: number;
    mealType: string;
    ingredients?: Ingredient[];
  }) => void;
  className?: string;
}

const SavedMealsList = memo(({ onSelectMeal, className }: SavedMealsListProps) => {
  const { data, isLoading } = useSavedMeals();
  const deleteMeal = useDeleteSavedMeal();
  const meals = data?.meals ?? [];
  const isPro = isLocalAuthMode || data?.isPro === true;
  const count = data?.count ?? 0;
  const limit = data?.limit ?? 5;

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-sm font-medium text-muted">Saved Meals</div>
        <div className="flex gap-2">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-10 w-24 animate-pulse rounded-lg bg-surface-2"
            />
          ))}
        </div>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className={cn("text-sm text-muted", className)}>
        No saved meals yet. Star a meal from your history to save it here.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">Quick Add</div>
        {!isPro && (
          <div className="text-xs text-muted">
            {count}/{limit} meals saved
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {meals.map((meal) => {
          const calories = Math.round(calculateCaloriesFromMacros(
            meal.protein,
            meal.carbs,
            meal.fats
          ));

          return (
            <motion.div
              key={meal.id}
              className="group flex items-center gap-1 rounded-lg border border-border bg-surface py-1 pr-1 pl-3 transition-[background-color,border-color] duration-200 hover:border-primary/30 hover:bg-surface-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="button"
                onClick={() => onSelectMeal(meal)}
                className="flex items-center gap-2 py-1 pr-1 outline-none"
              >
                <span className="text-sm font-medium text-foreground">
                  {meal.name}
                </span>
                <span className="text-xs text-muted">{calories} kcal</span>
              </button>
              <button
                type="button"
                onClick={(event_) => {
                  event_.stopPropagation();
                  deleteMeal.mutate(meal.id);
                }}
                disabled={deleteMeal.isPending}
                className="rounded-md p-1.5 text-muted opacity-0 transition-[opacity,background-color,color] duration-200 group-hover:opacity-100 hover:bg-error/10 hover:text-error disabled:opacity-50"
                title="Delete saved meal"
                aria-label={`Delete ${meal.name}`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
      {!isPro && count >= limit && (
        <div className="text-xs text-muted">
          Meal limit reached.{" "}
          <Button variant="ghost" buttonSize="sm" className="h-auto px-0 py-0 text-xs text-primary hover:text-primary/80">
            Upgrade to Pro
          </Button>{" "}
          for unlimited saved meals.
        </div>
      )}
    </div>
  );
});

SavedMealsList.displayName = "SavedMealsList";

export default SavedMealsList;
