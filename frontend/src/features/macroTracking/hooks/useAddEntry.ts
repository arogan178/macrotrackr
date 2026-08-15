import { useCallback } from "react";

import { useAddMacroEntry } from "@/hooks/queries/useMacroQueries";
import { useCreateSavedMeal } from "@/hooks/queries/useSavedMeals";
import type { MacroEntry } from "@/types/macro";

import type { MacroEntryInput } from "../types/macro";

/**
 * Adding an entry, and optionally saving it as a reusable meal.
 *
 * Extracted from HomePage because the Log sheet moved out of it: the sheet is
 * mounted by the layout so the tab bar's + opens it wherever the user is,
 * rather than navigating to Home first and dropping whatever they were doing.
 * Both callers need this logic and neither should own it.
 */
export function useAddEntry() {
  const addMacroEntryMutation = useAddMacroEntry();
  const createSavedMealMutation = useCreateSavedMeal();

  const saveAsMeal = useCallback(
    async (entry: MacroEntry) => {
      const entryName = entry.foodName ?? entry.mealName;
      if (!entryName) return;

      const ingredients =
        entry.ingredients && entry.ingredients.length > 0
          ? entry.ingredients
          : [
              {
                name: entryName,
                protein: entry.protein,
                carbs: entry.carbs,
                fats: entry.fats,
                quantity: 100,
                unit: "g",
                baseProtein: entry.protein,
                baseCarbs: entry.carbs,
                baseFats: entry.fats,
                baseQuantity: 100,
                baseUnit: "g",
              },
            ];

      await createSavedMealMutation.mutateAsync({
        name: entryName,
        protein: entry.protein,
        carbs: entry.carbs,
        fats: entry.fats,
        mealType: entry.mealType,
        ingredients,
      });
    },
    [createSavedMealMutation],
  );

  const addEntry = useCallback(
    async (entry: MacroEntryInput) => {
      const newEntry = await addMacroEntryMutation.mutateAsync(entry);
      if (entry.saveAsMeal) {
        await saveAsMeal({
          id: (newEntry as MacroEntry | undefined)?.id ?? 0,
          protein: entry.protein,
          carbs: entry.carbs,
          fats: entry.fats,
          mealType: entry.mealType,
          mealName: entry.mealName,
          ingredients: entry.ingredients,
        } as MacroEntry);
      }
    },
    [addMacroEntryMutation, saveAsMeal],
  );

  return {
    addEntry,
    saveAsMeal,
    isSaving: addMacroEntryMutation.isPending,
  };
}
