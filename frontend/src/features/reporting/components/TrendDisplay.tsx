import type { TrendDisplayProps } from "../types/insights-types";
import { TrendIcon } from "@/components/ui";
import AnimatedNumber from "@/components/animation/AnimatedNumber";

export default function TrendDisplay({ label, trend }: TrendDisplayProps) {
  return (
    <div>
      <div className="flex items-center mb-1">
        <span className="text-gray-300 font-medium">{label}:</span>
        <span className="ml-2 flex items-center">
          <TrendIcon direction={trend.direction} />{" "}
          <span className="text-gray-200">
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
      <p className="text-gray-400 text-sm">{trend.message}</p>
    </div>
  );
}
