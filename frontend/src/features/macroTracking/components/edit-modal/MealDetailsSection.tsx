import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import QuantityUnitField from "@/components/form/QuantityUnitField";
import TextField from "@/components/form/TextField";
import TimeField from "@/components/form/TimeField";
import Value from "@/components/ui/Value";
import { MEAL_TYPE_OPTIONS } from "@/features/macroTracking/constants";
import type { UnitType } from "@/features/macroTracking/utils/units";
import type { MealType } from "@/types/macro";

import { MacroSplitBar } from "../MacroSplitBar";

interface MealDetailsSectionProps {
  mealName: string;
  mealType: MealType;
  entryDate: string;
  entryTime: string;
  protein: number;
  carbs: number;
  fats: number;
  quantity?: number;
  unit?: string;
  isMultiIngredient: boolean;
  onMealNameChange: (value: string) => void;
  onMealTypeChange: (value: MealType) => void;
  onEntryDateChange: (value: string) => void;
  onEntryTimeChange: (value: string) => void;
  onMacroChange: (
    field: "protein" | "carbs" | "fats",
    value: number | undefined,
  ) => void;
  onQuantityChange?: (value: number | undefined) => void;
  onUnitChange?: (value: UnitType) => void;
  onQuantityUnitChange?: (
    quantity: number | undefined,
    unit: UnitType,
  ) => void;
  onAddIngredient?: () => void;
}

export default function MealDetailsSection({
  mealName,
  mealType,
  entryDate,
  entryTime,
  protein,
  carbs,
  fats,
  quantity,
  unit = "g",
  isMultiIngredient,
  onMealNameChange,
  onMealTypeChange,
  onEntryDateChange,
  onEntryTimeChange,
  onMacroChange,
  onQuantityChange,
  onUnitChange,
  onQuantityUnitChange,
  onAddIngredient,
}: MealDetailsSectionProps) {
  const calories = Math.round(protein * 4 + carbs * 4 + fats * 9);

  return (
    // The dialog is the container; a bordered box inside it was a box in a box.
    <section className="space-y-4">
      {isMultiIngredient && (
        <p className="text-xs text-muted">Totals update from the ingredients below.</p>
      )}

      <TextField
        label="Food name"
        value={mealName}
        onChange={onMealNameChange}
        placeholder="Enter food name"
        required
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Dropdown
          id="edit-meal-type"
          label="Meal type"
          options={MEAL_TYPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.display,
          }))}
          value={mealType}
          onChange={(value) => onMealTypeChange(value as MealType)}
        />
        <DateField
          id="edit-entry-date"
          label="Date"
          value={entryDate}
          onChange={onEntryDateChange}
          required
        />
        <TimeField
          id="edit-entry-time"
          label="Time"
          value={entryTime.slice(0, 5)}
          onChange={onEntryTimeChange}
          required
        />
      </div>

      {!isMultiIngredient && onQuantityChange && onUnitChange && (
        <QuantityUnitField
          label="Quantity"
          quantity={quantity}
          unit={(unit as UnitType) || "g"}
          onQuantityChange={onQuantityChange}
          onUnitChange={onUnitChange}
          onQuantityUnitChange={onQuantityUnitChange}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <NumberField
          label="Protein (g)"
          value={protein}
          onChange={(value) => onMacroChange("protein", value)}
          min={0}
          step={0.1}
          disabled={isMultiIngredient}
        />
        <NumberField
          label="Carbs (g)"
          value={carbs}
          onChange={(value) => onMacroChange("carbs", value)}
          min={0}
          step={0.1}
          disabled={isMultiIngredient}
        />
        <NumberField
          label="Fats (g)"
          value={fats}
          onChange={(value) => onMacroChange("fats", value)}
          min={0}
          step={0.1}
          disabled={isMultiIngredient}
        />
      </div>

      {/* The entry's figures as the actions sheet shows them: one line and
          its split, rather than four boxed tiles. */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Value value={calories} unit="kcal" size="stat" />
          <Value value={protein} unit="g" suffix="protein" className="text-protein" />
          <Value value={carbs} unit="g" suffix="carbs" className="text-carbs" />
          <Value value={fats} unit="g" suffix="fat" className="text-fats" />
        </div>
        <MacroSplitBar protein={protein} carbs={carbs} fats={fats} />
      </div>

      {!isMultiIngredient && onAddIngredient && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAddIngredient}
            className="flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface-2 py-3 text-sm font-medium text-foreground transition-[background-color,border-color,color,transform] duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-[0.98]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add ingredients
          </button>
        </div>
      )}
    </section>
  );
}
