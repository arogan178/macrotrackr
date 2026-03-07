import { NumberField, TextField } from "@/components/form";

interface MealDetailsSectionProps {
  mealName: string;
  protein: number;
  carbs: number;
  fats: number;
  onMealNameChange: (value: string) => void;
  onMacroChange: (field: "protein" | "carbs" | "fats", value: number | undefined) => void;
}

export default function MealDetailsSection({
  mealName,
  protein,
  carbs,
  fats,
  onMealNameChange,
  onMacroChange,
}: MealDetailsSectionProps) {
  const calories = Math.round(protein * 4 + carbs * 4 + fats * 9);

  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-surface/80 p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          Meal Details
        </p>
        <p className="text-xs text-muted">Totals update from ingredients below.</p>
      </div>

      <TextField
        label="Food Name"
        value={mealName}
        onChange={onMealNameChange}
        placeholder="Enter food name"
        required
      />

      <div className="grid gap-4 md:grid-cols-3">
        <NumberField
          label="Protein (g)"
          value={protein}
          onChange={(value) => onMacroChange("protein", value)}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Carbs (g)"
          value={carbs}
          onChange={(value) => onMacroChange("carbs", value)}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Fats (g)"
          value={fats}
          onChange={(value) => onMacroChange("fats", value)}
          min={0}
          step={0.1}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            Calories
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{calories}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-protein uppercase">
            Protein
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">{protein.toFixed(1)}g</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-carbs uppercase">
            Carbs
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">{carbs.toFixed(1)}g</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-2/70 p-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-fats uppercase">
            Fats
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">{fats.toFixed(1)}g</p>
        </div>
      </div>
    </section>
  );
}
