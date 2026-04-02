import { MacroIndicator } from "@/components/macros/MacroComponents";

interface MacroNutrientProps {
  label: string;
  current: number;
  target: number;
  color: "protein" | "carbs" | "fats";
}

function MacroNutrient({ label, current, target, color }: MacroNutrientProps) {
  return (
    <div className="rounded-xl border border-border/40 bg-surface p-3 transition-colors hover:border-border/80">
      <MacroIndicator
        name={label}
        value={current}
        target={target}
        color={color}
        showPercentage
      />
    </div>
  );
}

export default MacroNutrient;
