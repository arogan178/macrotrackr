import { Area, AreaChart, ResponsiveContainer } from "recharts";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { TrendIcon } from "@/components/ui";

import type { TrendDisplayProps as TrendDisplayProps } from "../types/insightsTypes";

export default function TrendDisplay({ label, trend, data, dataKey }: TrendDisplayProps) {
  // Chart colors - use CSS variables from design system (recharts renders in DOM so var() works)
  const colorMap: Record<string, string> = {
    up: "var(--color-success, #1ed760)",
    down: "var(--color-error, #e91429)",
    stable: "var(--text-muted, #b3b3b3)",
  };
  const color = colorMap[trend.direction] ?? colorMap.stable;

  const gradientId = `sparkline-${dataKey ?? label.toLowerCase().replaceAll(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col border-b border-border/40 pb-5 last:border-0 last:pb-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-foreground/90">{label}</span>
          <span className="mt-0.5 text-xs text-muted">
            {trend.message}
          </span>
        </div>
        
        <div className="flex items-center rounded-lg border border-border/40 bg-surface-2 px-2.5 py-1.5 text-sm font-medium">
          <TrendIcon direction={trend.direction} />{" "}
          <span className="ml-1.5 text-foreground">
            {trend.direction === "stable" ? (
              "Stable"
            ) : trend.direction === "insufficient" ? (
              "N/A"
            ) : (
              <div className="flex items-center gap-1">
                <AnimatedNumber
                  value={trend.percentage}
                  toFixedValue={0}
                  suffix="%"
                  duration={0.6}
                />
              </div>
            )}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      {data && data.length > 0 && dataKey && trend.direction !== "insufficient" && (
        <div className="mt-1 h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2}
                fill={`url(#${gradientId})`} 
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
