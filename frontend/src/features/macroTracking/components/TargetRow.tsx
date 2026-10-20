import Value from "@/components/ui/Value";
import { cn } from "@/lib/classnameUtilities";
import { formatGrouped } from "@/lib/formatNumber";

import { targetStatus } from "../utils/targetStatus";

/** Fills from zero once, on load: the page's single orchestrated moment. */
export const FILL_IN = "origin-left animate-[fill-in_700ms_ease-out]";

// A verdict worth noticing gets a tinted pill; a shortfall stays plain text.
export const CHIP = "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium";

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
  /** One figure per day: draws a bar per day against the target line instead of one fill. */
  days?: number[];
  /** Letters under the day bars; given to the last row only, as the shared axis. */
  dayLabels?: string[];
}

/**
 * A figure against its target. The full track is the target, so a full bar is
 * a target met and an orange one went past it; the right-hand status says it in
 * three words at most. With `days`, each day gets its own bar against one target
 * line, grey when it fell short: the pattern of a week reads before any figure.
 */
export default function TargetRow({
  name,
  value,
  target,
  unit,
  colorClass,
  shortfallLabel = "left",
  valuePrefix,
  days,
  dayLabels,
}: TargetRowProps) {
  const status = targetStatus(value, target);
  const fill = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  // Day bars top out above the highest day, so an over day still shows how far.
  const dayScale = Math.max(target, ...(days ?? [])) * 1.1 || 1;
  const dayHeight = (amount: number) => (amount / dayScale) * 100;

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
          <span className={cn(CHIP, "bg-primary/12 text-primary")}>On target</span>
        ) : status === "over" ? (
          <span className={cn(CHIP, "bg-warning/12 text-warning tabular-nums")}>
            {formatGrouped(value - target)} {unit} over
          </span>
        ) : (
          <Value
            value={Math.max(0, target - value)}
            unit={unit}
            suffix={shortfallLabel}
            className="shrink-0 text-muted"
          />
        )}
      </div>
      {days ? (
        <>
          <div className="relative mt-2 flex h-12 items-end gap-px border-b border-border" aria-hidden>
            {days.map((day, index) => {
              const dayStatus = targetStatus(day, target);

              return (
                <div key={index} className="flex h-full flex-1 items-end justify-center">
                  <div
                    className={cn(
                      "min-h-0.5 w-full max-w-2 rounded-t-full",
                      dayStatus === "empty" && "bg-foreground/8",
                      dayStatus === "under" && "bg-foreground/25",
                      dayStatus === "hit" && colorClass,
                      dayStatus === "over" && "bg-warning",
                    )}
                    style={{ height: `${dayHeight(day)}%` }}
                  />
                </div>
              );
            })}
            {target > 0 && (
              <div
                className="absolute inset-x-0 border-t border-dashed border-muted"
                style={{ bottom: `${dayHeight(target)}%` }}
              />
            )}
          </div>
          {dayLabels && (
            <div className="mt-1 flex gap-px text-[10px] text-muted" aria-hidden>
              {dayLabels.map((label, index) => (
                <span key={index} className="flex-1 text-center">
                  {label}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/8" aria-hidden>
          <div
            className={cn("h-full rounded-full", status === "over" ? "bg-warning" : colorClass, FILL_IN)}
            style={{ width: `${fill}%` }}
          />
        </div>
      )}
    </li>
  );
}
