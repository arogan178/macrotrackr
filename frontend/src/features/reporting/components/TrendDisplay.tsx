import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { TrendIcon } from "@/components/ui";

import type { TrendDisplayProps as TrendDisplayProps } from "../types/insightsTypes";

export default function TrendDisplay({ label, trend }: TrendDisplayProps) {
  return (
    <div className="flex flex-col border-b border-border/40 pb-4 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-foreground/90">{label}</span>
        <span className="flex items-center text-sm font-medium">
          <TrendIcon direction={trend.direction} />{" "}
          <span className="ml-1 text-foreground">
            {trend.direction === "stable" ? (
              "Stable"
            ) : trend.direction === "insufficient" ? (
              "Insufficient data"
            ) : (
              <>
                <AnimatedNumber
                  value={trend.percentage}
                  toFixedValue={0}
                  suffix={`% ${
                    trend.direction === "up" ? "increase" : "decrease"
                  }`}
                  duration={0.6}
                />
              </>
            )}
          </span>
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{trend.message}</p>
    </div>
  );
}
