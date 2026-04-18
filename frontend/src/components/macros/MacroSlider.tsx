// src/components/macros/MacroSlider.tsx

import { useMemo, useState } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { IconButton, LockIcon, RangeSlider, UnlockIcon } from "@/components/ui";
import type { MacroType } from "@/types/macro";

import { COLOR_MAP, PROGRESS_BAR_COLORS } from "../utils";

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
}

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
}: MacroSliderProps) {
  const macro = useMemo<MacroType>(
    () =>
      (["protein", "carbs", "fats"] as readonly MacroType[]).includes(
        name.toLowerCase() as MacroType,
      )
        ? (name.toLowerCase() as MacroType)
        : color,
    [name, color],
  );

  const [recommendationText, setRecommendationText] = useState(
    getRecommendation(macro, value),
  );

  const colorProps = useMemo(() => {
    const properties = COLOR_MAP[color] ?? COLOR_MAP.protein;
    // Avoid noisy logs in production; keep a single dev hint
    const shouldWarn = !COLOR_MAP[color] && import.meta.env?.DEV;
    if (shouldWarn) {
      console.warn(
        `MacroSlider: Unknown color '${color}', using 'protein' as fallback.`,
      );
    }

    return properties;
  }, [color]);

  const { iconColor, dot } = colorProps;

  const isEffectivelyDisabled = disabled || (isLocked && !disabled);

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="text-sm text-muted">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleLock && (
            <IconButton
              variant="custom"
              onClick={onToggleLock}
              ariaLabel={isLocked ? `Unlock ${name}` : `Lock ${name}`}
              icon={
                isLocked ? (
                  <LockIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                ) : (
                  <UnlockIcon className="h-3.5 w-3.5 text-muted" />
                )
              }
              className="rounded-full p-1.5"
              buttonSize="sm"
              disabled={disabled}
            />
          )}
          <AnimatedNumber
            value={value}
            className="w-8 text-right text-sm font-medium text-muted"
            suffix="%"
          />
        </div>
      </div>

      <RangeSlider
        value={value}
        onChange={(newValue) => {
          onChange(newValue);
          setRecommendationText(getRecommendation(macro, newValue));
        }}
        min={min}
        max={max}
        step={1}
        disabled={isEffectivelyDisabled}
        showFillTrack
        trackColorClass={PROGRESS_BAR_COLORS[color]}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{min}%</span>
        <span className="h-4 max-w-45 text-center text-xs text-muted">
          {recommendationText}
        </span>
        <span className="text-xs text-muted">{max}%</span>
      </div>
    </div>
  );
}

function getRecommendation(macro: MacroType, value: number): string {
  if (macro === "protein") {
    if (value < 15) return "Consider increasing for muscle maintenance";
    if (value > 35) return "High protein intake";

    return "Ideal range for most people";
  }
  if (macro === "carbs") {
    if (value < 40) return "Low carb approach";
    if (value > 65) return "High carb approach";

    return "Balanced carb intake";
  }
  // fats
  if (value < 20) return "Consider increasing for hormone health";
  if (value > 40) return "Higher fat approach";

  return "Healthy fat intake";
}

interface MacroBadgeProps {
  name: string;
  value: number;
  color: MacroType;
  isLocked?: boolean;
}

export function MacroBadge({
  name,
  value,
  color,
  isLocked = false,
}: MacroBadgeProps) {
  const {
    border,
    iconColor,
    dot: badgeDot,
  } = useMemo(() => COLOR_MAP[color], [color]);

  return (
    <div className={`rounded-lg border bg-surface-2 p-3 ${border}`}>
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${badgeDot}`} />
        <span className="text-xs text-foreground">{name}</span>
        {isLocked && <LockIcon className={`h-3 w-3 ${iconColor}`} />}
      </div>
      <div className="mt-1 w-12 text-lg font-semibold text-foreground">
        <AnimatedNumber value={value} suffix="%" />
      </div>
    </div>
  );
}
