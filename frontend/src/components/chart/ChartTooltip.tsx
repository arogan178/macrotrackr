import { getUnitForStat } from "../../utils/chart-colors";

interface TooltipData {
  name: string;
  value: number;
  percentage?: number;
  [key: string]: any;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipData }>;
  selectedStat?: string;
  formatter?: (value: any, key?: string) => string;
}

/**
 * ChartTooltip - A reusable tooltip component for charts
 */
function ChartTooltip({
  active,
  payload,
  selectedStat = "calories",
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const unit = getUnitForStat(selectedStat);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-md shadow-xl p-2 text-sm">
      <p className="font-medium text-white">{data.name}</p>
      <p className="text-gray-300">
        <span className="font-medium">
          {selectedStat === "calories" ? "~" : ""}
          {formatter
            ? formatter(data.value, selectedStat)
            : data.value.toFixed(1)}
          {unit}
        </span>
        {data.percentage !== undefined && (
          <span className="ml-1 text-gray-400">({data.percentage}%)</span>
        )}
      </p>

      {/* Show calories if not already displayed */}
      {selectedStat !== "calories" && typeof data.calories === "number" && (
        <p className="text-gray-400 text-xs mt-1">
          ~ {data.calories.toFixed(0)} kcal
        </p>
      )}

      {/* Show count if available and not the selected stat */}
      {selectedStat !== "count" && typeof data.count === "number" && (
        <p className="text-gray-400 text-xs">
          {data.count} {data.count !== 1 ? "items" : "item"}
        </p>
      )}
    </div>
  );
}

export default ChartTooltip;
