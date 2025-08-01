import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { getUnitForStat } from "@/utils/chartColors";

interface TooltipData {
  name: string;
  value: number;
  percentage?: number;
  [key: string]: unknown;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipData }>;
  selectedStat?: string;
  formatter?: (value: number, key?: string) => string;
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
  if (!active || !payload || payload.length === 0) {
    return;
  }

  const data = payload[0].payload;
  const unit = getUnitForStat(selectedStat);

  return (
    <div className="rounded-md border border-border bg-surface p-2 text-sm shadow-modal">
      <p className="font-medium text-foreground">{data.name}</p>{" "}
      <p className="text-foreground">
        <span className="font-medium">
          {selectedStat === "calories" ? "~" : ""}
          {formatter ? (
            formatter(data.value, selectedStat)
          ) : (
            <AnimatedNumber value={data.value} toFixedValue={1} suffix={unit} />
          )}
        </span>
        {data.percentage !== undefined && (
          <span className="ml-1 text-foreground">
            (
            <AnimatedNumber value={data.percentage} suffix="%" />)
          </span>
        )}
      </p>
      {/* Show calories if not already displayed */}{" "}
      {selectedStat !== "calories" && typeof data.calories === "number" && (
        <p className="mt-1 text-xs text-foreground">
          ~{" "}
          <AnimatedNumber
            value={data.calories}
            toFixedValue={0}
            suffix=" kcal"
          />
        </p>
      )}
      {/* Show count if available and not the selected stat */}{" "}
      {selectedStat !== "count" && typeof data.count === "number" && (
        <p className="text-xs text-foreground">
          <AnimatedNumber value={data.count} />{" "}
          {data.count === 1 ? "item" : "items"}
        </p>
      )}
    </div>
  );
}

export default ChartTooltip;
