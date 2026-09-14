import { memo } from "react";

interface CalculatorResultBarProps {
  result?: { label: string; value: string };
}

/**
 * Keeps the answer on screen while the inputs are still being filled in, below
 * md only. The full result card used to do this by docking to the bottom of the
 * viewport, but at 577px tall it covered the form it was reporting on.
 */
function CalculatorResultBar({ result }: CalculatorResultBarProps) {
  if (!result) return null;

  return (
    <div
      aria-live="polite"
      className="sticky bottom-[var(--sab)] z-20 flex items-baseline justify-between gap-3 border-t border-border-2 bg-surface-2 px-4 py-3 md:hidden"
    >
      <span className="text-[11px] font-medium tracking-wider text-muted uppercase">
        {result.label}
      </span>
      <span className="text-lg font-semibold tracking-tight text-primary tabular-nums">
        {result.value}
      </span>
    </div>
  );
}

export default memo(CalculatorResultBar);
