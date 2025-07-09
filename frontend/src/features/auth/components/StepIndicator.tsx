import { memo } from "react";
import { CheckMarkIcon } from "@/components/ui";
import {
  StepInfo,
  calculateProgressPercentage,
  getStepIndicatorStyles,
  getStepCircleClasses,
} from "../utils/step-utils";

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
    <div className="w-full mb-6">
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div
          className="absolute top-4 h-0.5 bg-gray-700 transform -translate-y-1/2"
          style={trackStyle}
        />

        {/* Progress line */}
        <div
          className="absolute top-4 h-0.5 bg-indigo-500 transform -translate-y-1/2 transition-all duration-500 ease-in-out"
          style={{
            left: progressLineLeftPosition,
            width: `calc(${progressPercentage}% * ${
              (steps.length - 1) / steps.length
            })`,
          }}
        />

        {/* Step circles */}
        <div className="relative z-10 flex w-full justify-between">
          {steps.map((info, idx) => {
            const { circleClasses, labelClasses, isComplete } =
              getStepCircleClasses(idx, currentStep);

            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                style={{
                  width: `${100 / steps.length}%`,
                }}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 transition-all duration-300 ${circleClasses}`}
                >
                  {isComplete ? (
                    <CheckMarkIcon className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1 transition-colors duration-300 ${labelClasses}`}
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
