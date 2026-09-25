import { useState } from "react";

import type { SavedMeal, UpdateSavedMealPayload } from "@/api/savedMeals";
import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import QuantityUnitField from "@/components/form/QuantityUnitField";
import TextField from "@/components/form/TextField";
import Modal from "@/components/ui/Modal";
import { useMutationErrorHandler } from "@/hooks";
import { useUpdateSavedMeal } from "@/hooks/queries/useSavedMeals";
import { formatGrouped } from "@/lib/formatNumber";
import { useStore } from "@/store/store";
import type { MealType } from "@/types/macro";

import { calculateCaloriesFromMacros } from "../calculations";
import { MEAL_TYPE_OPTIONS } from "../constants";
import {
  calculateTotalsFromIngredients,
  scaleIngredient,
} from "../utils/ingredientScaling";
import type { UnitType } from "../utils/units";

interface SavedMealEditModalProps {
  meal: SavedMeal;
  onClose: () => void;
}

export default function SavedMealEditModal({
  meal,
  onClose,
}: SavedMealEditModalProps) {
  const [name, setName] = useState(meal.name);
  const [mealType, setMealType] = useState<MealType>(meal.mealType);
  const [protein, setProtein] = useState<number | undefined>(meal.protein);
  const [carbs, setCarbs] = useState<number | undefined>(meal.carbs);
  const [fats, setFats] = useState<number | undefined>(meal.fats);
  const [ingredients, setIngredients] = useState(meal.ingredients);
  const updateMeal = useUpdateSavedMeal();
  const showNotification = useStore((state) => state.showNotification);
  const { handleMutationError } = useMutationErrorHandler({
    onError: (message) => showNotification(message, "error"),
  });

  const ingredientCount = meal.ingredients.length;
  const canEditMacros = ingredientCount <= 1;
  const trimmedName = name.trim();

  const handleIngredientChange = (
    index: number,
    quantity: number | undefined,
    unit: string,
  ) => {
    // Scale from the saved ingredient so repeated edits do not compound rounding.
    setIngredients((previous) =>
      previous.map((ingredient, index_) =>
        index_ === index
          ? scaleIngredient(meal.ingredients[index], quantity, unit)
          : ingredient,
      ),
    );
  };

  const handleSave = async () => {
    const macros = { protein: protein ?? 0, carbs: carbs ?? 0, fats: fats ?? 0 };
    let payload: UpdateSavedMealPayload = canEditMacros
      ? { name: trimmedName, mealType, ...macros }
      : { name: trimmedName, mealType };

    if (canEditMacros) {
      const [ingredient] = meal.ingredients;
      if (ingredient) {
        // Stale bases would win over the new totals; without them the log form
        // re-derives per-100g values from the totals and quantity.
        payload.ingredients = [
          {
            ...ingredient,
            ...macros,
            baseProtein: undefined,
            baseCarbs: undefined,
            baseFats: undefined,
          },
        ];
      }
    } else if (ingredients !== meal.ingredients) {
      payload = {
        ...payload,
        ...calculateTotalsFromIngredients(ingredients),
        ingredients,
      };
    }

    try {
      await updateMeal.mutateAsync({ id: meal.id, payload });
      onClose();
    } catch (error) {
      handleMutationError(error, "updating saved meal");
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit saved meal"
      variant="form"
      size="sm"
      onSave={() => void handleSave()}
      saveDisabled={trimmedName === "" || updateMeal.isPending}
    >
      <div className="space-y-4">
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          maxLength={100}
          required
        />
        <Dropdown
          id="saved-meal-type"
          label="Meal Type"
          options={MEAL_TYPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.display,
          }))}
          value={mealType}
          onChange={(value) => setMealType(value as MealType)}
        />
        {canEditMacros ? (
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              label="Protein (g)"
              value={protein}
              onChange={setProtein}
              min={0}
              step={0.1}
            />
            <NumberField
              label="Carbs (g)"
              value={carbs}
              onChange={setCarbs}
              min={0}
              step={0.1}
            />
            <NumberField
              label="Fats (g)"
              value={fats}
              onChange={setFats}
              min={0}
              step={0.1}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Macros come from its {ingredientCount} ingredients.
            </p>
            {ingredients.map((ingredient, index) => {
              const unit = (ingredient.unit as UnitType) || "g";
              const calories = Math.round(
                calculateCaloriesFromMacros(
                  ingredient.protein,
                  ingredient.carbs,
                  ingredient.fats,
                ),
              );

              return (
                <QuantityUnitField
                  key={index}
                  label={ingredient.name}
                  quantity={ingredient.quantity}
                  unit={unit}
                  onQuantityChange={(quantity) =>
                    handleIngredientChange(index, quantity, unit)
                  }
                  onUnitChange={(newUnit) =>
                    handleIngredientChange(index, ingredient.quantity, newUnit)
                  }
                  onQuantityUnitChange={(quantity, newUnit) =>
                    handleIngredientChange(index, quantity, newUnit)
                  }
                  helperText={`${formatGrouped(calories)} kcal`}
                />
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
