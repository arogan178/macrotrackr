import { memo } from "react";

import { CheckMarkIcon } from "@/components/ui";

import {
  calculateProgressPercentage,
  getStepCircleClasses,
  getStepIndicatorStyles,
  StepInfo,
} from "../utils/stepUtilities";

interface StepIndicatorProps {
  currentStep: number;
  steps: StepInfo[];
}

export const StepIndicator = memo(function StepIndicator({
  currentStep,
  steps,
}: StepIndicatorProps) {
  const progressPercentage = calculateProgressPercentage(currentStep);
  const { trackStyle, progressLineLeftPosition } = getStepIndicatorStyles(
    steps.length,
  );

  return (
    <div className="mb-6 w-full">
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div
          className="absolute top-4 h-0.5 -translate-y-1/2 transform bg-surface"
          style={trackStyle}
        />

        {/* Progress line */}
        <div
          className="absolute top-4 h-0.5 -translate-y-1/2 transform bg-primary transition-all duration-500 ease-in-out"
          style={{
            left: progressLineLeftPosition,
            width: `calc(${progressPercentage}% * ${
              (steps.length - 1) / steps.length
            })`,
          }}
        />

        {/* Step circles */}
        <div className="relative z-10 flex w-full justify-between">
          {steps.map((info, index) => {
            const { circleClasses, labelClasses, isComplete } =
              getStepCircleClasses(index, currentStep);

            return (
              <div
                key={index}
                className="flex flex-col items-center"
                style={{
                  width: `${100 / steps.length}%`,
                }}
              >
                <div
                  className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${circleClasses}`}
                >
                  {isComplete ? (
                    <CheckMarkIcon className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-1 text-xs tracking-[0.2em] transition-colors duration-300 ${labelClasses}`}
                >
                  {info.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
