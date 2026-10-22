import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { TrendIcon } from "@/components/ui";
import Value from "@/components/ui/Value";

import type { TrendDisplayProps } from "../types/insightsTypes";
import { TREND_AVG_DAYS } from "../utils/insightsCalculations";

export default function TrendDisplay({
  label,
  trend,
  data,
  dataKey,
  icon,
  unit = "g",
}: TrendDisplayProps) {
  // `--text-muted` does not exist — the token is `--color-muted` — so "stable"
  // was always falling through to a literal that happened to match it. The
  // fallbacks are gone with it: a hex here is a transcription that can drift.
  const colorMap: Record<string, string> = {
    up: "var(--color-foreground)",
    down: "var(--color-foreground)",
    stable: "var(--color-muted)",
  };
  const strokeColor = colorMap[trend.direction] ?? colorMap.stable;

  const gradientId = `sparkline-${dataKey ?? label.toLowerCase().replaceAll(/\s+/g, "-")}`;

  const hasStats =
    trend.direction !== "insufficient" &&
    typeof trend.lastAvg === "number" &&
    typeof trend.firstAvg === "number";

  return (
    <div className="flex flex-col justify-between border-b border-border py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate text-sm text-foreground">{label}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted">
          <TrendIcon direction={trend.direction} />
          <span className="whitespace-nowrap text-foreground">
            {trend.direction === "stable"
              ? "Stable"
              : trend.direction === "insufficient"
                ? "N/A"
                : `${Math.round(trend.percentage)}%`}
          </span>
        </div>
      </div>

      {/* Main Metric Value & Baseline Change */}
      <div className="my-2.5 flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          {hasStats ? (
            <div className="flex items-baseline gap-1">
              <Value value={trend.lastAvg!} size="stat" />
              {/* A recent-days average, so it differs from the period average above. */}
              <span className="text-xs font-medium text-muted">
                {trend.unit ?? unit}/d, last {TREND_AVG_DAYS} days
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
              trend.delta === 0 ? "text-muted" : "text-foreground"
            }`}
          >
            {trend.delta > 0 ? `+${trend.delta}` : trend.delta}{" "}
            {trend.unit ?? unit}
          </span>
        )}
      </div>

      {/* Micro Sparkline */}
      {data &&
      data.length > 0 &&
      dataKey &&
      trend.direction !== "insufficient" ? (
        <div className="h-9 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
              accessibilityLayer={false}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={strokeColor}
                    stopOpacity={0.35}
                  />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                activeDot={false}
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
