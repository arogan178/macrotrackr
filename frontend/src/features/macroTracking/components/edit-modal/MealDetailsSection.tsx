import NumberField from "@/components/form/NumberField";
import QuantityUnitField from "@/components/form/QuantityUnitField";
import TextField from "@/components/form/TextField";
import type { UnitType } from "@/features/macroTracking/utils/units";

interface MealDetailsSectionProps {
  mealName: string;
  protein: number;
  carbs: number;
  fats: number;
  quantity?: number;
  unit?: string;
  isMultiIngredient: boolean;
  onMealNameChange: (value: string) => void;
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
  protein,
  carbs,
  fats,
  quantity,
  unit = "g",
  isMultiIngredient,
  onMealNameChange,
  onMacroChange,
  onQuantityChange,
  onUnitChange,
  onQuantityUnitChange,
  onAddIngredient,
}: MealDetailsSectionProps) {
  const calories = Math.round(protein * 4 + carbs * 4 + fats * 9);

  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-surface/80 p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          Meal Details
        </p>
        <p className="text-xs text-muted">
          {isMultiIngredient
            ? "Totals update from ingredients below."
            : "Adjust quantity, unit, or macros directly."}
        </p>
      </div>

      <TextField
        label="Food Name"
        value={mealName}
        onChange={onMealNameChange}
        placeholder="Enter food name"
        required
      />

      {!isMultiIngredient && onQuantityChange && onUnitChange && (
        <QuantityUnitField
          label="Quantity & Unit"
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

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            Calories
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {calories}
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-protein uppercase">
            Protein
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {protein.toFixed(1)}g
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-carbs uppercase">
            Carbs
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {carbs.toFixed(1)}g
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-fats uppercase">
            Fats
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {fats.toFixed(1)}g
          </p>
        </div>
      </div>

      {!isMultiIngredient && onAddIngredient && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAddIngredient}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-surface-2/30 py-3 text-sm font-medium text-foreground transition-[background-color,border-color,color,transform] duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-[0.98]"
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
            Add Ingredient (Convert to Multi-Ingredient Meal)
          </button>
        </div>
      )}
    </section>
  );
}
