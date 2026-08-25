import { memo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { DURATIONS } from "@/components/utils/UiConstants";
import { cn } from "@/lib/classnameUtilities";
import { formatGrouped } from "@/lib/formatNumber";

export type ValueSize = "hero" | "stat" | "inline";
export type ValueUnit = "kcal" | "g" | "kg" | "lb" | "%" | "";

// The figures are the product, so this is where the width axis earns the font
// file. `hero` runs condensed and heavier than it did: a nutrition panel sets
// its calorie count narrow and bold, not light and wide, because the number has
// to survive being read from across a kitchen. `inline` stays at normal width —
// it sits inside sentences, where condensed type only costs legibility.
const SIZE_CLASS: Record<ValueSize, string> = {
  hero: "font-stretch-condensed text-5xl font-bold tracking-tight",
  stat: "font-stretch-condensed text-2xl font-semibold tracking-tight",
  inline: "text-sm",
};

const UNIT_CLASS: Record<ValueSize, string> = {
  hero: "text-base",
  stat: "text-xs",
  inline: "text-xs",
};

/**
 * One number treatment for the whole product. The same figure was previously
 * set four ways — 26px bold green, 19px semibold, 22px bold with a pointless
 * decimal, and 13px regular — with three spellings of its unit.
 *
 * Rounding lives here rather than at each call site: kcal and grams are whole
 * numbers, weight gets one decimal.
 */
const DECIMALS: Record<ValueUnit, number> = {
  kcal: 0,
  g: 0,
  kg: 1,
  lb: 1,
  "%": 0,
  "": 0,
};

interface ValueProps {
  value: number;
  unit?: ValueUnit;
  size?: ValueSize;
  /** Always signed. Used for deltas, which are never coloured red. */
  signed?: boolean;
  /** Count up on mount. At most one per screen: the value that moves. */
  animate?: boolean;
  /** Trailing context, muted: "of 2,200", "avg", "over". */
  suffix?: string;
  className?: string;
}

function ValueInner({
  value,
  unit = "",
  size = "inline",
  signed = false,
  animate = false,
  suffix,
  className,
}: ValueProps) {
  const decimals = DECIMALS[unit];
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = formatGrouped(safeValue, decimals);
  const sign = signed && safeValue > 0 ? "+" : "";

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span className={cn(SIZE_CLASS[size], "tabular-nums")}>
        {animate ? (
          <AnimatedNumber
            value={safeValue}
            toFixedValue={decimals}
            duration={DURATIONS.value}
          />
        ) : (
          `${sign}${formatted}`
        )}
      </span>
      {unit ? (
        <span className={cn(UNIT_CLASS[size], "text-muted")}>{unit}</span>
      ) : null}
      {suffix ? (
        <span className={cn(UNIT_CLASS[size], "text-muted")}>{suffix}</span>
      ) : null}
    </span>
  );
}

const Value = memo(ValueInner);
export default Value;
