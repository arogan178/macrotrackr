// src/components/macros/MacroSlider.tsx

import { IconButton, LockIcon, RangeSlider, UnlockIcon } from "@/components/ui";
import Value from "@/components/ui/Value";
import { cn } from "@/lib/classnameUtilities";
import type { MacroType } from "@/types/macro";

/** The share of calories most people do well on; drawn as a band on the track. */
const USUAL_RANGE: Record<MacroType, { min: number; max: number }> = {
  protein: { min: 20, max: 35 },
  carbs: { min: 45, max: 65 },
  fats: { min: 20, max: 35 },
};

const MACRO_CLASS: Record<
  MacroType,
  { dot: string; band: string; icon: string }
> = {
  protein: { dot: "bg-protein", band: "bg-protein/30", icon: "text-protein" },
  carbs: { dot: "bg-carbs", band: "bg-carbs/30", icon: "text-carbs" },
  fats: { dot: "bg-fats", band: "bg-fats/30", icon: "text-fats" },
};

interface MacroSliderProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
  color: MacroType;
  isLocked?: boolean;
  onToggleLock?: () => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  /** What the macro is for, in one short line under its name. */
  note?: string;
  /** Grams a day at the current calorie target, beside the percentage. */
  grams?: number;
}

/**
 * One macro: its name and purpose, a slider whose usual range is shaded on the
 * track, and the share it sets with the grams that share means. In a narrow
 * panel the three stack; in a wide one they read across as one row.
 */
export default function MacroSlider({
  name,
  value,
  onChange,
  color,
  isLocked = false,
  onToggleLock,
  disabled = false,
  min = 5,
  max = 70,
  note,
  grams,
}: MacroSliderProps) {
  const range = USUAL_RANGE[color];
  const classes = MACRO_CLASS[color];
  // States the range and lets the band show where the thumb sits: phrased as
  // "below", it flagged the app's own default split as a problem.
  const rangeText = `Usual ${range.min} to ${range.max}%`;

  return (
    // Sized by its panel, not the screen: the calculator sets it in a narrow
    // card on a wide page.
    <div className="@container">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 @3xl:grid-cols-[14rem_minmax(0,1fr)_9rem] @3xl:gap-x-10">
        <div className="col-start-1 row-start-1 flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", classes.dot)} />
          <span className="text-sm font-medium text-foreground">{name}</span>
        </div>

        {note ? (
          <p className="col-span-2 row-start-2 text-xs leading-relaxed text-muted @3xl:col-span-1 @3xl:col-start-1">
            {note}
          </p>
        ) : null}

        <div className="col-span-2 row-start-3 @3xl:col-span-1 @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1">
          <RangeSlider
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={1}
            disabled={disabled || isLocked}
            band={range}
            bandClassName={classes.band}
            ariaLabel={`${name} share of calories`}
            unit="percent"
          />
          <div className="mt-1.5 flex justify-between gap-3 text-xs text-muted">
            <span>{min}%</span>
            <span className="text-center">{rangeText}</span>
            <span>{max}%</span>
          </div>
        </div>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 @3xl:col-start-3 @3xl:row-span-2 @3xl:row-start-1">
          <div className="text-right">
            <Value value={value} unit="%" size="stat" />
            {grams === undefined ? null : (
              <p className="text-xs text-muted">
                <Value value={grams} unit="g" /> a day
              </p>
            )}
          </div>
          {onToggleLock && (
            <IconButton
              variant="custom"
              onClick={onToggleLock}
              ariaLabel={isLocked ? `Unlock ${name}` : `Lock ${name}`}
              icon={
                isLocked ? (
                  <LockIcon className={cn("h-3.5 w-3.5", classes.icon)} />
                ) : (
                  <UnlockIcon className="h-3.5 w-3.5 text-muted" />
                )
              }
              className="rounded-full p-1.5"
              buttonSize="sm"
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
