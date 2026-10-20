import { memo } from "react";

import type { SavedMeal } from "@/api/savedMeals";
import Button from "@/components/ui/Button";
import { EditIcon, TrashIcon } from "@/components/ui/Icons";
import Value from "@/components/ui/Value";
import { TOUCH_TARGET } from "@/components/utils/UiConstants";
import { isLocalAuthMode } from "@/config/runtime";
import {
  useDeleteSavedMeal,
  useSavedMeals,
} from "@/hooks/queries/useSavedMeals";
import { cn } from "@/lib/classnameUtilities";
import type { Ingredient, MealType } from "@/types/macro";

import { calculateCaloriesFromMacros } from "../calculations";

interface SavedMealsListProps {
  onSelectMeal: (meal: {
    name: string;
    protein: number;
    carbs: number;
    fats: number;
    mealType: MealType;
    ingredients?: Ingredient[];
  }) => void;
  onEditMeal: (meal: SavedMeal) => void;
  query?: string;
  className?: string;
}

const SavedMealsList = memo(
  ({ onSelectMeal, onEditMeal, query = "", className }: SavedMealsListProps) => {
    const { data, isLoading } = useSavedMeals();
    const deleteMeal = useDeleteSavedMeal();
    const meals = data?.meals ?? [];
    const matchingMeals = meals.filter((meal) =>
      meal.name.toLowerCase().includes(query.toLowerCase()),
    );
    const isPro = isLocalAuthMode || data?.isPro === true;
    const count = data?.count ?? 0;
    const limit = data?.limit ?? 5;

    if (isLoading) {
      return (
        <div className={cn("space-y-2", className)}>
          <div className="text-sm font-medium text-muted">Saved meals</div>
          <div className="flex gap-2">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-10 w-24 animate-pulse rounded-control bg-surface-2"
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
        {!isPro && (
          <div className="text-xs text-muted">
            {count} of {limit} meals saved
          </div>
        )}
        {matchingMeals.length === 0 ? (
          <div className="text-sm text-muted">No saved meals match</div>
        ) : (
          <ul className="divide-y divide-border">
            {matchingMeals.map((meal) => {
              const calories = Math.round(
                calculateCaloriesFromMacros(meal.protein, meal.carbs, meal.fats),
              );

              return (
                <li key={meal.id} className="flex min-h-12 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectMeal(meal)}
                    className="flex min-w-0 flex-1 items-baseline justify-between gap-3 py-2 text-left outline-none"
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">
                      {meal.name}
                    </span>
                    <Value value={calories} unit="kcal" className="shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditMeal(meal)}
                    className={`${TOUCH_TARGET} rounded-control p-1.5 text-muted hover:text-foreground`}
                    aria-label={`Edit ${meal.name}`}
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMeal.mutate(meal.id)}
                    disabled={deleteMeal.isPending}
                    className={`${TOUCH_TARGET} rounded-control p-1.5 text-muted hover:text-error disabled:opacity-50`}
                    aria-label={`Delete ${meal.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!isPro && count >= limit && (
          <div className="text-xs text-muted">
            Meal limit reached.{" "}
            <Button
              variant="ghost"
              buttonSize="sm"
              className="h-auto px-0 py-0 text-xs text-primary hover:text-primary/80"
              onClick={() => {
                globalThis.location.href = "/pricing";
              }}
            >
              Upgrade to Pro
            </Button>{" "}
            for unlimited saved meals.
          </div>
        )}
      </div>
    );
  },
);

SavedMealsList.displayName = "SavedMealsList";

export default SavedMealsList;
