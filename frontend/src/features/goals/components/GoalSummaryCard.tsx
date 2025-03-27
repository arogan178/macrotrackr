import { CardContainer, InfoCard } from "@/components/form";
import { GoalSummaryCardProps } from "../types";
import { CalorieIcon, ChevronRightIcon } from "@/components/Icons";

export default function GoalSummaryCard({
  goalData,
  tdee,
}: GoalSummaryCardProps) {
  if (!goalData) return null;

  const {
    currentWeight,
    targetWeight,
    weightGoal,
    adjustedCalorieIntake = 0,
    targetDate,
    calculatedWeeks = 0,
    weeklyChange = 0,
  } = goalData;

  const weightDifference = Math.abs(targetWeight - currentWeight).toFixed(1);
  const weeklyChangeAbs = Math.abs(weeklyChange).toFixed(2);
  const isWeightLoss = currentWeight > targetWeight;

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
              <span className={`text-${goalColor}-400 ml-2`}>
                ({isWeightLoss ? "-" : "+"}
                {weightDifference} kg)
              </span>
            </div>
          </InfoCard>

          <InfoCard title="Timeline">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Estimated Duration</p>
                <p className="text-lg font-medium text-gray-200">
                  {calculatedWeeks} weeks
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Target Completion</p>
                <p className="text-lg font-medium text-gray-200">
                  {targetDate
                    ? new Date(targetDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not set"}
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Nutrition Plan">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Weekly Rate</p>
                <p className="text-lg font-medium text-gray-200">
                  {isWeightLoss ? "-" : "+"}
                  {weeklyChangeAbs} kg/week
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Daily Calories</p>
                <div className="flex items-baseline">
                  <p className="text-lg font-medium text-gray-200">
                    {adjustedCalorieIntake} kcal
                  </p>
                  <p className="text-xs text-gray-400 ml-2">
                    ({isWeightLoss ? "-" : "+"}
                    {Math.abs(tdee - adjustedCalorieIntake)} from TDEE)
                  </p>
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </CardContainer>
  );
}
