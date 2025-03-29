import { CardContainer, InfoCard } from "@/components/form";
import { WeightDetailsCardProps } from "../types";
import { CalorieIcon, ChevronRightIcon } from "@/components/Icons";
import { useEffect, useState } from "react";

export default function WeightDetailsCard({
  goalData,
  tdee,
}: WeightDetailsCardProps) {
  if (!goalData) return null;

  const [durationDisplay, setDurationDisplay] =
    useState<string>("Not calculated");
  const [targetCompletionDisplay, setTargetCompletionDisplay] =
    useState<string>("Not set");

  const {
    currentWeight,
    targetWeight,
    weightGoal,
    adjustedCalorieIntake = 0,
    targetDate,
    calculatedWeeks,
    weeklyChange = 0,
  } = goalData;

  useEffect(() => {
    // Update duration display whenever goal data changes
    if (currentWeight === targetWeight) {
      setDurationDisplay("Ongoing");
    } else if (typeof calculatedWeeks === "number" && calculatedWeeks > 0) {
      setDurationDisplay(`${calculatedWeeks} weeks`);
    } else {
      setDurationDisplay("Not calculated");
    }

    // Update target completion display
    if (currentWeight === targetWeight) {
      setTargetCompletionDisplay("Ongoing");
    } else if (targetDate) {
      setTargetCompletionDisplay(
        new Date(targetDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    } else {
      setTargetCompletionDisplay("Not set");
    }
  }, [currentWeight, targetWeight, calculatedWeeks, targetDate]);

  const weightDifference = Math.abs(targetWeight - currentWeight).toFixed(1);
  const weeklyChangeAbs = Math.abs(weeklyChange).toFixed(2);
  const isWeightLoss = currentWeight > targetWeight;
  const isMaintenance = currentWeight === targetWeight;

  const goalTypeLabel = isWeightLoss
    ? "Weight Loss"
    : currentWeight < targetWeight
    ? "Weight Gain"
    : "Weight Maintenance";

  const goalColor = isWeightLoss
    ? "indigo"
    : currentWeight < targetWeight
    ? "green"
    : "blue";

  return (
    <CardContainer>
      <div className="p-5">
        <div className="flex items-center mb-5">
          <div className={`p-2 rounded-lg bg-${goalColor}-600/20 mr-3`}>
            <CalorieIcon className={`w-5 h-5 text-${goalColor}-400`} />
          </div>
          <h2 className="text-xl font-semibold text-gray-200">
            {goalTypeLabel} Plan
          </h2>
        </div>

        <div className="space-y-5">
          <InfoCard title="Weight Change">
            <div className="text-lg font-medium text-gray-200 flex items-center space-x-2">
              <span>{currentWeight} kg</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span>{targetWeight} kg</span>
              {!isMaintenance && (
                <span className={`text-${goalColor}-400 ml-2`}>
                  ({isWeightLoss ? "-" : "+"}
                  {weightDifference} kg)
                </span>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Timeline">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Estimated Duration</p>
                <p className="text-lg font-medium text-gray-200">
                  {durationDisplay}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Target Completion</p>
                <p className="text-lg font-medium text-gray-200">
                  {targetCompletionDisplay}
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Nutrition Plan">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Weekly Rate</p>
                <p className="text-lg font-medium text-gray-200">
                  {isMaintenance
                    ? "Maintain weight"
                    : `${isWeightLoss ? "-" : "+"}${weeklyChangeAbs} kg/week`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Daily Calories</p>
                <div className="flex items-baseline">
                  <p className="text-lg font-medium text-gray-200">
                    {adjustedCalorieIntake} kcal
                  </p>
                  {tdee && adjustedCalorieIntake !== tdee && (
                    <p className="text-xs text-gray-400 ml-2">
                      ({adjustedCalorieIntake < tdee ? "-" : "+"}
                      {Math.abs(tdee - adjustedCalorieIntake)} from TDEE)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </CardContainer>
  );
}
