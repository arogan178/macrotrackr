import { Area, AreaChart, ResponsiveContainer } from "recharts";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { TrendIcon } from "@/components/ui";

import type { TrendDisplayProps } from "../types/insightsTypes";

export default function TrendDisplay({
  label,
  trend,
  data,
  dataKey,
  icon,
  iconBgColor = "bg-primary/10",
  unit = "g",
}: TrendDisplayProps) {
  const colorMap: Record<string, string> = {
    up: "var(--color-success, #1ed760)",
    down: "var(--color-error, #e91429)",
    stable: "var(--text-muted, #b3b3b3)",
  };
  const strokeColor = colorMap[trend.direction] ?? colorMap.stable;

  const gradientId = `sparkline-${dataKey ?? label.toLowerCase().replaceAll(/\s+/g, "-")}`;

  const hasStats =
    trend.direction !== "insufficient" &&
    typeof trend.lastAvg === "number" &&
    typeof trend.firstAvg === "number";

  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-2/40 p-3.5 border border-border/30 transition-colors hover:border-border/60">
      {/* Header: Icon + Title & Direction Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBgColor}`}
            >
              {icon}
            </div>
          )}
          <span className="text-xs font-semibold tracking-tight text-foreground/90 uppercase">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border/40 bg-surface-2/80 px-2 py-0.5 text-xs font-medium">
          <TrendIcon direction={trend.direction} />
          <span className="text-foreground">
            {trend.direction === "stable" ? (
              "Stable"
            ) : trend.direction === "insufficient" ? (
              "N/A"
            ) : (
              <AnimatedNumber
                value={trend.percentage}
                toFixedValue={0}
                suffix="%"
                duration={0.5}
              />
            )}
          </span>
        </div>
      </div>

      {/* Main Metric Value & Baseline Change */}
      <div className="my-2.5 flex items-baseline justify-between">
        <div>
          {hasStats ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-foreground">
                <AnimatedNumber
                  value={trend.lastAvg!}
                  toFixedValue={0}
                  duration={0.5}
                />
              </span>
              <span className="text-xs font-medium text-muted">
                {trend.unit ?? unit}/d
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted leading-tight block max-w-[150px]">
              {trend.message}
            </span>
          )}
        </div>

        {hasStats && trend.delta !== undefined && (
          <span
            className={`text-xs font-medium ${
              trend.delta > 0
                ? "text-success"
                : trend.delta < 0
                  ? "text-error"
                  : "text-muted"
            }`}
          >
            {trend.delta > 0 ? `+${trend.delta}` : trend.delta} {trend.unit ?? unit}
          </span>
        )}
      </div>

      {/* Micro Sparkline */}
      {data && data.length > 0 && dataKey && trend.direction !== "insufficient" ? (
        <div className="h-9 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-9 w-full flex items-center justify-center rounded bg-surface/20 text-[10px] text-muted/60">
          No sparkline
        </div>
      )}
    </div>
  );
}
