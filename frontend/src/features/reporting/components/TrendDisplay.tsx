import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { TrendIcon } from "@/components/ui";

import type { TrendDisplayProps as TrendDisplayProps } from "../types/insightsTypes";

export default function TrendDisplay({ label, trend }: TrendDisplayProps) {
  return (
    <div>
      <div className="flex items-center mb-1">
        <span className="text-foreground font-medium">{label}:</span>
        <span className="ml-2 flex items-center">
          <TrendIcon direction={trend.direction} />{" "}
          <span className="text-foreground">
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
      <p className="text-foreground text-sm">{trend.message}</p>
    </div>
  );
}
