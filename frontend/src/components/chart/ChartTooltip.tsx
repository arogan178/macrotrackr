import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { getUnitForStat } from "@/utils/chartColors";

/**
 * Base types used by the chart tooltips
 */
interface TooltipData {
  name: string;
  value: number;
  percentage?: number;
  calories?: number;
  count?: number;
  [key: string]: unknown;
}

/**
 * Line chart payload entry from recharts
 */
interface LineChartPayloadEntry {
  name: string;
  value: number;
  payload?: TooltipData;
}

/**
 * Bar chart payload entry from recharts
 */
interface BarChartPayloadEntry {
  payload: TooltipData;
}

/**
 * Generic recharts payload entry that could be either line or bar chart
 */
interface RechartsPayloadEntry {
  name?: string;
  value?: number;
  payload?: TooltipData;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<RechartsPayloadEntry>;
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

  // Type guards for recharts payloads
  // Line chart: [{ name: dataKey, value, ... }]
  // Bar chart: [{ payload: { ... } }]
  let value: number | undefined;
  let label: string | undefined;
  let percentage: number | undefined;
  let calories: number | undefined;
  let count: number | undefined;

  // Check if this is a line chart payload (has .name and .value)
  // Try to find a line chart entry (has name and value)
  const lineEntry = payload.find(
    (item): item is LineChartPayloadEntry =>
      typeof item.name === "string" &&
      Object.prototype.hasOwnProperty.call(item, "value") &&
      item.name === selectedStat,
  );

  if (lineEntry && typeof lineEntry.value === "number") {
    value = lineEntry.value;
    label = lineEntry.payload?.name ?? lineEntry.name;
    percentage =
      typeof lineEntry.payload?.percentage === "number"
        ? lineEntry.payload.percentage
        : undefined;
    calories =
      typeof lineEntry.payload?.calories === "number"
        ? lineEntry.payload.calories
        : undefined;
    count =
      typeof lineEntry.payload?.count === "number"
        ? lineEntry.payload.count
        : undefined;
  } else if (
    payload[0] &&
    typeof payload[0].payload === "object" &&
    payload[0].payload !== null
  ) {
    // Bar chart fallback
    const data = payload[0].payload;
    value =
      typeof data[selectedStat] === "number"
        ? (data[selectedStat] as number)
        : typeof data.value === "number"
          ? data.value
          : undefined;
    label = typeof data.name === "string" ? data.name : undefined;
    percentage =
      typeof data.percentage === "number" ? data.percentage : undefined;
    calories = typeof data.calories === "number" ? data.calories : undefined;
    count = typeof data.count === "number" ? data.count : undefined;
  }

  const unit = getUnitForStat(selectedStat);

  return (
    <div className="rounded-md border border-border bg-surface-2 p-2 text-sm shadow-modal">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-foreground">
        <span className="font-medium">
          {selectedStat === "calories" ? "~" : ""}
          {formatter ? (
            formatter(value ?? 0, selectedStat)
          ) : (
            <AnimatedNumber value={value ?? 0} toFixedValue={1} suffix={unit} />
          )}
        </span>
        {typeof percentage === "number" && (
          <span className="ml-1 text-foreground">
            (<AnimatedNumber value={percentage} suffix="%" />)
          </span>
        )}
      </p>
      {selectedStat !== "calories" && typeof calories === "number" && (
        <p className="mt-1 text-xs text-foreground">
          ~ <AnimatedNumber value={calories} toFixedValue={0} suffix=" kcal" />
        </p>
      )}
      {selectedStat !== "count" && typeof count === "number" && (
        <p className="text-xs text-foreground">
          <AnimatedNumber value={count} /> {count === 1 ? "item" : "items"}
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
 * Stacked bar chart payload data for macro breakdown
 */
interface StackedBarPayloadData {
  period: string;
  protein: number;
  carbs: number;
  fats: number;
  calories?: number;
  [key: string]: unknown;
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
  payload?: Array<{ payload: StackedBarPayloadData }>;
  colors?: Record<string, string>; // e.g., { protein: '#34d399', carbs: '#60a5fa', fats: '#f87171' }
  labelKey?: string;
}) {
  if (!active || !payload || payload.length === 0) return;
  const data = payload[0].payload;
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
                <AnimatedNumber
                  value={Number.isFinite(pct) ? pct : 0}
                  toFixedValue={0}
                  suffix="%"
                />
              </span>
            </p>
          );
        })}
      </div>
      {typeof data.calories === "number" && (
        <p className="mt-1 border-t border-border pt-1 text-xs text-foreground">
          <AnimatedNumber
            value={Math.round(data.calories)}
            suffix=" calories"
          />
        </p>
      )}
    </div>
  );
}
