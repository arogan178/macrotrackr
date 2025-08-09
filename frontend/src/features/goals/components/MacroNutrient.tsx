import { MacroIndicator } from "@/components/macros";

interface MacroNutrientProps {
  label: string;
  current: number;
  target: number;
  color: "protein" | "carbs" | "fats";
}

function MacroNutrient({ label, current, target, color }: MacroNutrientProps) {
  return (
    <div className="rounded-lg bg-surface-2 p-2">
      <MacroIndicator
        name={label}
        value={current}
        target={target}
        color={color}
        showPercentage={true}
      />
    </div>
  );
}

export default MacroNutrient;
