import { ReferenceLine } from "recharts";

import type { ChartDataPoint, LineConfig } from "@/components/chart/ChartTypes";
import LineChartComponent from "@/components/chart/LineChartComponent";
import Panel from "@/components/ui/Panel";
import { formatGrouped } from "@/lib/formatNumber";

/**
 * The two scenes that are genuinely charts, drawn with the same Recharts
 * component Analytics uses rather than a CSS imitation of one.
 *
 * Split into its own chunk on purpose. `vendor-charts` is ~114 KB gzipped and
 * has no business on the critical path of a marketing page, so this is lazily
 * imported by ProductPreview and lands while the first scene, which needs no
 * chart, is still playing.
 */

const WEEK_TARGET = 2200;

export const WEEK_DATA: ChartDataPoint[] = [
  { name: "Mon", calories: 1980 },
  { name: "Tue", calories: 2240 },
  { name: "Wed", calories: 2105 },
  { name: "Thu", calories: 1870 },
  { name: "Fri", calories: 2390 },
  { name: "Sat", calories: 2510 },
  { name: "Sun", calories: 1940 },
];

export const WEIGHT_DATA: ChartDataPoint[] = [
  { name: "Wk 1", weight: 86 },
  { name: "Wk 2", weight: 85.4 },
  { name: "Wk 3", weight: 84.9 },
  { name: "Wk 4", weight: 84.1 },
  { name: "Wk 5", weight: 83.6 },
  { name: "Wk 6", weight: 82.9 },
  { name: "Wk 7", weight: 82.4 },
];

// Explicitly animated, unlike the in-app charts: here the drawing of the line
// is the point. 1400ms is long enough to read as a line being drawn rather than
// a state change, and sits inside the scene's 4400ms hold.
const CALORIE_LINE: LineConfig[] = [
  {
    dataKey: "calories",
    name: "Calories",
    color: "var(--color-primary)",
    isArea: true,
    type: "monotone",
    isAnimationActive: true,
    animationDuration: 1400,
  },
];

const WEIGHT_LINE: LineConfig[] = [
  {
    dataKey: "weight",
    name: "Weight (kg)",
    color: "var(--color-primary)",
    isArea: true,
    type: "monotone",
    isAnimationActive: true,
    animationDuration: 1400,
  },
];

/**
 * Recharts animates on mount, so the chart is not rendered until the scene
 * starts: mounting it with an empty array and then handing it the series gave
 * it nothing to animate from, and the line simply appeared. Feeding it a point
 * at a time was worse, restarting the animation on every tick.
 */
export function WeekChart({ step }: { step: number }) {
  const started = step > 0;
  const average = Math.round(
    WEEK_DATA.reduce((sum, day) => sum + (day.calories as number), 0) /
      WEEK_DATA.length,
  );

  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="flex items-baseline justify-between px-4 py-3">
        <span className="text-sm font-semibold">This week</span>
        <span className="text-xs text-muted tabular-nums">
          {average ? `${formatGrouped(average)} kcal average` : " "}
        </span>
      </div>
      <div className="border-t border-border px-2 pt-4 pb-2">
        {started ? (
        <LineChartComponent
          data={WEEK_DATA}
          lines={CALORIE_LINE}
          isLoading={false}
          height={200}
          showNoDataMessage={false}
          yAxisProps={{ domain: [1600, 2700], width: 40 }}
          chartElements={
            <ReferenceLine
              y={WEEK_TARGET}
              stroke="var(--color-border-2)"
              strokeDasharray="4 4"
            />
          }
        />
        ) : (
          <div className="h-[200px]" />
        )}
      </div>
      <p className="border-t border-border px-4 py-3 text-xs text-muted">
        {started
          ? "Two days over the line, five under. The dashed line is your target."
          : "Drawing the week"}
      </p>
    </Panel>
  );
}

export function GoalChart({ step }: { step: number }) {
  const started = step > 0;
  const current = (WEIGHT_DATA.at(-1)?.weight as number) ?? 86;

  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="flex items-baseline justify-between px-4 py-3">
        <span className="text-sm font-semibold">Weight goal</span>
        <span className="text-xs text-muted">86.0 to 78.0 kg</span>
      </div>
      <div className="px-4 pt-3">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-light tracking-tight tabular-nums">
            {current.toFixed(1)}
          </span>
          <span className="text-sm text-muted">kg</span>
          <span className="ml-1 text-sm text-primary tabular-nums">
            {(current - 86).toFixed(1)}
          </span>
        </p>
      </div>
      <div className="px-2 pt-2 pb-2">
        {started ? (
        <LineChartComponent
          data={WEIGHT_DATA}
          lines={WEIGHT_LINE}
          isLoading={false}
          height={170}
          showNoDataMessage={false}
          yAxisProps={{ domain: [77, 87], width: 40 }}
          chartElements={
            <ReferenceLine
              y={78}
              stroke="var(--color-border-2)"
              strokeDasharray="4 4"
            />
          }
        />
        ) : (
          <div className="h-[170px]" />
        )}
      </div>
      <p className="border-t border-border px-4 py-3 text-xs text-muted">
        {started
          ? "Seven weeks in, 3.6 kg down, on pace for the target line."
          : "Plotting seven weigh-ins"}
      </p>
    </Panel>
  );
}
