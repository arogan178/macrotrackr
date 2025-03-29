import { MacroIndicator } from "@/components/nutrition";

interface MacroNutrientProps {
  label: string;
  current: number;
  target: number;
  color: "red" | "blue" | "green";
}

function MacroNutrient({ label, current, target, color }: MacroNutrientProps) {
  return (
    <div className="bg-gray-700/30 rounded-lg p-2">
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
