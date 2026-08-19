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
  // `--text-muted` does not exist — the token is `--color-muted` — so "stable"
  // was always falling through to a literal that happened to match it. The
  // fallbacks are gone with it: a hex here is a transcription that can drift.
  const colorMap: Record<string, string> = {
    up: "var(--color-success)",
    down: "var(--color-error)",
    stable: "var(--color-muted)",
  };
  const strokeColor = colorMap[trend.direction] ?? colorMap.stable;

  const gradientId = `sparkline-${dataKey ?? label.toLowerCase().replaceAll(/\s+/g, "-")}`;

  const hasStats =
    trend.direction !== "insufficient" &&
    typeof trend.lastAvg === "number" &&
    typeof trend.firstAvg === "number";

  return (
    <div className="flex flex-col justify-between rounded-control bg-surface-2 p-3.5 border border-border transition-colors hover:border-border">
      {/* Header: Icon + Title & Direction Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-control ${iconBgColor}`}
            >
              {icon}
            </div>
          )}
          <span className="text-xs font-semibold tracking-tight text-foreground/90 uppercase truncate">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-control border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium shrink-0 whitespace-nowrap">
          <TrendIcon direction={trend.direction} />
          <span className="text-foreground whitespace-nowrap">
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
      <div className="my-2.5 flex items-baseline justify-between gap-2">
        <div className="min-w-0">
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
            <span className="text-xs text-muted leading-tight block">
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
        <div className="h-9 w-full flex items-center justify-center rounded-control bg-surface text-[10px] text-muted/60">
          No sparkline
        </div>
      )}
    </div>
  );
}
