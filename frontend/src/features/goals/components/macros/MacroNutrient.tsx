import { MacroIndicator } from "@/components/macros/MacroComponents";

interface MacroNutrientProps {
  label: string;
  current: number;
  target: number;
  color: "protein" | "carbs" | "fats";
}

function MacroNutrient({ label, current, target, color }: MacroNutrientProps) {
  return (
    <div>
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
