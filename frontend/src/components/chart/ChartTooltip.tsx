import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { getUnitForStat } from "@/utils/chartColors";

/**
 * Base types used by the chart tooltips
 */
interface TooltipData {
  name: string;
  value: number;
  percentage?: number;
  [key: string]: unknown;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipData }>;
  selectedStat?: string;
  formatter?: (value: number, key?: string) => string;
}

/**
 * ChartTooltip - Default tooltip used for line charts showing a single selected stat
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

  const data = payload[0].payload as TooltipData;
  const unit = getUnitForStat(selectedStat);

  return (
    <div className="rounded-md border border-border bg-surface-2 p-2 text-sm shadow-modal">
      <p className="font-medium text-foreground">{data.name}</p>
      <p className="text-foreground">
        <span className="font-medium">
          {selectedStat === "calories" ? "~" : ""}
          {formatter ? (
            formatter(data.value, selectedStat)
          ) : (
            <AnimatedNumber value={data.value} toFixedValue={1} suffix={unit} />
          )}
        </span>
        {typeof data.percentage === "number" && (
          <span className="ml-1 text-foreground">
            (<AnimatedNumber value={data.percentage} suffix="%" />)
          </span>
        )}
      </p>
      {selectedStat !== "calories" &&
        typeof (data as any).calories === "number" && (
          <p className="mt-1 text-xs text-foreground">
            ~{" "}
            <AnimatedNumber
              value={(data as any).calories as number}
              toFixedValue={0}
              suffix=" kcal"
            />
          </p>
        )}
      {selectedStat !== "count" && typeof (data as any).count === "number" && (
        <p className="text-xs text-foreground">
          <AnimatedNumber value={(data as any).count as number} />{" "}
          {(data as any).count === 1 ? "item" : "items"}
        </p>
      )}
    </div>
  );
}

export default ChartTooltip;

/**
 * BarValueTooltip - Reusable tooltip for Bar charts showing a single value + unit (+ optional percentage/count)
 * Intended for MealTimeBreakdown.
 */
export function BarValueTooltip({
  active,
  payload,
  selectedStat = "calories",
  formatter,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percentage?: number;
      calories?: number;
      count?: number;
    };
  }>;
  selectedStat?: string;
  formatter?: (value: number, key?: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return;
  const data = payload[0].payload;
  const unit = getUnitForStat(selectedStat);

  return (
    <div className="rounded-md border border-border bg-surface p-2 text-sm shadow-modal">
      <p className="font-medium text-foreground">{data.name}</p>
      <p className="text-foreground">
        <span className="font-medium">
          {selectedStat === "calories" ? "~" : ""}
          {formatter ? (
            formatter(data.value, selectedStat)
          ) : (
            <>
              <AnimatedNumber value={data.value} toFixedValue={1} />
              {unit}
            </>
          )}
        </span>
        {typeof data.percentage === "number" && (
          <span className="ml-1 text-foreground">
            (<AnimatedNumber value={data.percentage} suffix="%" />)
          </span>
        )}
      </p>
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
      {selectedStat !== "count" && typeof data.count === "number" && (
        <p className="text-xs text-foreground">
          <AnimatedNumber value={data.count} /> meal
          {data.count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

/**
 * StackedBarPercentageTooltip - Reusable tooltip for stacked bar charts showing per-macro percentages + calories
 * Intended for MacroDensityBreakdown.
 */
export function StackedBarPercentageTooltip({
  active,
  payload,
  colors,
  labelKey = "period",
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, any> }>;
  colors?: Record<string, string>; // e.g., { protein: '#34d399', carbs: '#60a5fa', fats: '#f87171' }
  labelKey?: string;
}) {
  if (!active || !payload || payload.length === 0) return;
  const data = payload[0].payload as Record<string, any>;
  const macroKeys = ["protein", "carbs", "fats"] as const;

  return (
    <div className="rounded-md border border-border bg-surface p-2 text-sm shadow-modal">
      <p className="mb-1 font-medium text-foreground">
        {String(data[labelKey] ?? "")}
      </p>
      <div className="space-y-0.5">
        {macroKeys.map((key) => {
          const pct = Number(data[key]) * 100;
          const color = colors?.[key];
          return (
            <p key={key} className="text-foreground">
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{key}</span>{" "}
              <span className="font-medium">
                {Number.isFinite(pct) ? pct.toFixed(0) : "0"}%
              </span>
            </p>
          );
        })}
      </div>
      {typeof data.calories === "number" && (
        <p className="mt-1 border-t border-border pt-1 text-xs text-foreground">
          {Math.round(data.calories)} calories
        </p>
      )}
    </div>
  );
}
