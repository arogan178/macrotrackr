import { memo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";

import { INCOMPLETE_STATS_HINT } from "./calculatorInputs";
import { calculatorEyebrowClass } from "./calculatorStyles";

interface ResultHeadlineProps {
  label: string;
  value: number;
  unit: string;
  /** When false the number is replaced by a placeholder and a short hint. */
  ready?: boolean;
  /** Overrides the hint shown while `ready` is false. */
  hint?: string;
}

/**
 * The single headline figure at the top of every calculator result card.
 */
function ResultHeadline({
  label,
  value,
  unit,
  ready = true,
  hint = INCOMPLETE_STATS_HINT,
}: ResultHeadlineProps) {
  return (
    <div>
      <span className={calculatorEyebrowClass}>{label}</span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
          {ready ? (
            <AnimatedNumber value={value} />
          ) : (
            <span aria-hidden>—</span>
          )}
        </span>
        <span className="text-lg font-medium text-muted">{unit}</span>
      </div>
      {ready ? null : (
        <p className="mt-2 text-sm leading-relaxed text-muted">{hint}</p>
      )}
    </div>
  );
}

export default memo(ResultHeadline);
