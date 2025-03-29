import ProgressBar from "@/components/ProgressBar";

interface MacroNutrientProps {
  label: string;
  current: number;
  target: number;
  color: "red" | "blue" | "green";
}

function MacroNutrient({ label, current, target, color }: MacroNutrientProps) {
  const progress = Math.min(Math.round((current / target) * 100), 100);
  const colorClasses = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  };

  return (
    <div className="bg-gray-700/30 rounded-lg p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${colorClasses[color]}`}
          ></span>
          <span className="text-xs text-gray-300">{label}</span>
        </div>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-sm font-semibold text-gray-200">
          {Math.round(current)}g
        </span>
        <span className="text-xs text-gray-500">/ {target}g</span>
      </div>
      <ProgressBar progress={progress} color={color} height="sm" />
    </div>
  );
}

export default MacroNutrient;
