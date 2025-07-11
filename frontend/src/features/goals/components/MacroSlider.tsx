import { useState } from "react";

import { AnimatedNumber } from "@/components/animation";
import { FormButton } from "@/components/form";
import { LockIcon, UnlockIcon } from "@/components/ui";

interface MacroSliderProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
  color: "green" | "blue" | "red";
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

  const colorConfig = {
    green: {
      bg: "bg-green-500",
      focus: "focus:ring-green-500/50",
      textLocked: "text-green-400",
      bgLocked: "bg-green-900/30",
    },
    blue: {
      bg: "bg-blue-500",
      focus: "focus:ring-blue-500/50",
      textLocked: "text-blue-400",
      bgLocked: "bg-blue-900/30",
    },
    red: {
      bg: "bg-red-500",
      focus: "focus:ring-red-500/50",
      textLocked: "text-red-400",
      bgLocked: "bg-red-900/30",
    },
  };

  const { bg, focus, textLocked, bgLocked } = colorConfig[color];

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

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${bg}`}></div>
          <span className="text-sm text-gray-300">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleLock && (
            <FormButton
              variant="ghost"
              buttonSize="sm"
              onClick={onToggleLock}
              type="button"
              className={`p-1.5 rounded-full ${
                isLocked
                  ? `${textLocked} ${bgLocked}`
                  : "text-gray-500 hover:text-gray-300"
              }`}
              ariaLabel={isLocked ? `Unlock ${name}` : `Lock ${name}`}
              icon={
                isLocked ? (
                  <LockIcon className="w-3.5 h-3.5" />
                ) : (
                  <UnlockIcon className="w-3.5 h-3.5" />
                )
              }
            />
          )}{" "}
          <AnimatedNumber
            value={value}
            className="text-sm font-medium text-gray-200 w-8 text-right"
            suffix="%"
          />
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={handleChange}
          disabled={disabled || (isLocked && !disabled)}
          className={`w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer
                    focus:outline-none ${focus}
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                    [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:${bg} 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                    ${disabled || (isLocked && !disabled) ? "opacity-50" : ""}`}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{min}%</span>
        <span className="text-xs text-gray-400 max-w-[180px] text-center h-4">
          {recommendationText}
        </span>
        <span className="text-xs text-gray-400">{max}%</span>
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
  color: "green" | "blue" | "red";
  isLocked?: boolean;
}

export function MacroBadge({
  name,
  value,
  color,
  isLocked = false,
}: MacroBadgeProps) {
  const colorConfig = {
    green: {
      border: "border-green-500/20",
      iconColor: "text-green-500",
    },
    blue: {
      border: "border-blue-500/20",
      iconColor: "text-blue-500",
    },
    red: {
      border: "border-red-500/20",
      iconColor: "text-red-500",
    },
  };

  const { border, iconColor } = colorConfig[color];

  return (
    <div className={`bg-gray-800/50 rounded-lg p-3 border ${border}`}>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
        <span className="text-xs text-gray-400">{name}</span>
        {isLocked && <LockIcon className={`w-3 h-3 ${iconColor}`} />}
      </div>{" "}
      <div className="mt-1 text-lg font-semibold text-gray-200 w-12">
        <AnimatedNumber value={value} suffix="%" />
      </div>
    </div>
  );
}
