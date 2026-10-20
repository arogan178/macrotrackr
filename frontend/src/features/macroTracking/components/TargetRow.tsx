import Value from "@/components/ui/Value";
import { cn } from "@/lib/classnameUtilities";

import { TARGET_TOLERANCE, targetStatus } from "../utils/targetStatus";

/** Fills from zero once, on load: the page's single orchestrated moment. */
export const FILL_IN = "origin-left animate-[fill-in_700ms_ease-out]";

interface TargetRowProps {
  name: string;
  value: number;
  target: number;
  unit: "g" | "kcal";
  /** The fill and the name's dot. */
  colorClass: string;
  /** "left" for a day in progress, "under" for an average. */
  shortfallLabel?: "left" | "under";
  /** Read before the figure, as in "avg 121 g". */
  valuePrefix?: string;
}

/**
 * A figure against its target. The dashed band is "on target" (within 10%),
 * the fill is the figure; where the fill ends against the band is the answer,
 * and the right-hand status says it in three words at most.
 */
export default function TargetRow({
  name,
  value,
  target,
  unit,
  colorClass,
  shortfallLabel = "left",
  valuePrefix,
}: TargetRowProps) {
  const status = targetStatus(value, target);
  const scale = Math.max(target * 1.25, value) || 1;
  const position = (amount: number) => Math.min(100, (amount / scale) * 100);
  const bandStart = position(target * (1 - TARGET_TOLERANCE));
  const bandEnd = position(target * (1 + TARGET_TOLERANCE));

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className={cn("h-2 w-2 shrink-0 self-center rounded-full", colorClass)} />
          <span className="text-sm">{name}</span>
          {valuePrefix ? <span className="text-xs text-muted">{valuePrefix}</span> : null}
          <Value value={value} unit={unit} suffix={`of ${Math.round(target)}`} />
        </span>
        {status === "hit" ? (
          <span className="shrink-0 text-xs font-medium text-primary">On target</span>
        ) : status === "over" ? (
          <Value value={value - target} unit={unit} suffix="over" className="shrink-0 text-warning" />
        ) : (
          <Value
            value={Math.max(0, target - value)}
            unit={unit}
            suffix={shortfallLabel}
            className="shrink-0 text-muted"
          />
        )}
      </div>
      <div className="relative mt-2 h-2" aria-hidden>
        <div className="absolute inset-0 overflow-hidden rounded-full bg-foreground/8">
          <div
            className={cn("h-full rounded-full", colorClass, FILL_IN)}
            style={{ width: `${position(value)}%` }}
          />
        </div>
        {target > 0 && (
          <div
            className="absolute -top-1 -bottom-1 rounded-full border border-dashed border-muted"
            style={{ left: `${bandStart}%`, width: `${bandEnd - bandStart}%` }}
          />
        )}
      </div>
    </li>
  );
}
