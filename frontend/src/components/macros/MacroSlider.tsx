// src/components/macros/MacroSlider.tsx

import { useState } from "react";
import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { IconButton, LockIcon, UnlockIcon } from "@/components/ui";
import { COLOR_MAP } from "../utils";

interface MacroSliderProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
  color: "protein" | "carbs" | "fats";
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
  const [recommendationText, setRecommendationText] = useState(
    getRecommendation(
      name.toLowerCase() as "protein" | "carbs" | "fats",
      value,
    ),
  );

  let colorProps = COLOR_MAP[color];
  if (!colorProps) {
    console.warn(
      `MacroSlider: Unknown color '${color}', using 'protein' as fallback.`,
    );
    colorProps = COLOR_MAP["protein"];
  }
  const { bg, iconColor } = colorProps;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = Number.parseInt(event.target.value);
    onChange(newValue);
    setRecommendationText(
      getRecommendation(
        name.toLowerCase() as "protein" | "carbs" | "fats",
        newValue,
      ),
    );
  }

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${bg}`}></div>
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
                  <LockIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                ) : (
                  <UnlockIcon className="w-3.5 h-3.5 text-muted" />
                )
              }
              className="p-1.5 rounded-full"
              buttonSize="sm"
              disabled={disabled}
            />
          )}
          <AnimatedNumber
            value={value}
            className="text-sm font-medium text-muted w-8 text-right"
            suffix="%"
          />
        </div>
      </div>

      <div className="relative h-4 flex items-center">
        {/* Background Track */}
        <div className="absolute w-full h-2 bg-surface/80 rounded-lg" />
        {/* Filled Track */}
        <div
          className={`absolute h-2 ${bg} rounded-lg`}
          style={{ width: `${percentage}%` }}
        />
        {/* Actual Slider Input */}
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={handleChange}
          disabled={disabled || (isLocked && !disabled)}
          className={`relative w-full h-4 bg-transparent appearance-none cursor-pointer
                    focus:outline-none
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                    [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:${bg} 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:${bg} [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer
                    [&::-webkit-slider-runnable-track]:bg-transparent
                    [&::-moz-range-track]:bg-transparent
                    ${disabled || (isLocked && !disabled) ? "opacity-50" : ""}`}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted">{min}%</span>
        <span className="text-xs text-muted max-w-[180px] text-center h-4">
          {recommendationText}
        </span>
        <span className="text-xs text-muted">{max}%</span>
      </div>
    </div>
  );
}

function getRecommendation(
  macro: "protein" | "carbs" | "fats",
  value: number,
): string {
  if (macro === "protein") {
    if (value < 15) return "Consider increasing for muscle maintenance";
    if (value > 35) return "High protein intake";
    return "Ideal range for most people";
  } else if (macro === "carbs") {
    if (value < 40) return "Low carb approach";
    if (value > 65) return "High carb approach";
    return "Balanced carb intake";
  } else {
    if (value < 20) return "Consider increasing for hormone health";
    if (value > 40) return "Higher fat approach";
    return "Healthy fat intake";
  }
}

interface MacroBadgeProps {
  name: string;
  value: number;
  color: "protein" | "carbs" | "fats";
  isLocked?: boolean;
}

export function MacroBadge({
  name,
  value,
  color,
  isLocked = false,
}: MacroBadgeProps) {
  let badgeColorProps = COLOR_MAP[color];
  if (!badgeColorProps) {
    console.warn(
      `MacroBadge: Unknown color '${color}', using 'protein' as fallback.`,
    );
    badgeColorProps = COLOR_MAP["protein"];
  }
  const { border, iconColor } = badgeColorProps;

  return (
    <div className={`bg-background/50 rounded-lg p-3 border ${border}`}>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full bg-${color}`}></div>
        <span className="text-xs text-muted">{name}</span>
        {isLocked && <LockIcon className={`w-3 h-3 ${iconColor}`} />}
      </div>{" "}
      <div className="mt-1 text-lg font-semibold text-muted w-12">
        <AnimatedNumber value={value} suffix="%" />
      </div>
    </div>
  );
}
