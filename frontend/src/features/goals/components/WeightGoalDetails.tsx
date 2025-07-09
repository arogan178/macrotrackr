import { CardContainer } from "@/components/form";
import { WeightGoals } from "@/types/goal";
import { EditIcon, TrashIcon } from "@/components/Icons";
import ProgressBar from "@/components/form/ProgressBar";

interface WeightGoalDetailsProps {
  goalData: WeightGoals;
  tdee: number;
  progressPercentage?: number;
  weightRemaining?: number;
  insight?: string;
  onEdit: () => void;
  onDelete: () => void;
}

function getDirectionText(
  startingWeight: number | null,
  targetWeight: number | null
) {
  if (startingWeight === null || targetWeight === null) return "Maintaining";
  if (targetWeight < startingWeight) return "Losing";
  if (targetWeight > startingWeight) return "Gaining";
  return "Maintaining";
}

function WeightGoalDetails({
  goalData,
  tdee,
  progressPercentage = 0,
  weightRemaining = 0,
  insight = "",
  onEdit,
  onDelete,
}: WeightGoalDetailsProps) {
  // Extract goal data with safe defaults
  const {
    startingWeight = null, // Changed from startingWeight to startingWeight
    targetWeight = null,
    calorieTarget = null,
    startDate = null,
    targetDate = null,
  } = goalData;

  // Format dates for display
  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";

  const formattedTargetDate = targetDate
    ? new Date(targetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";

  // Calculate days remaining if target date exists
  const daysRemaining = targetDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(targetDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  // Get direction text based on starting and target weights
  const directionText = getDirectionText(startingWeight, targetWeight);

  // Calculate calorie difference from TDEE
  const calorieAdjustment = tdee && calorieTarget ? tdee - calorieTarget : 0;
  const isDeficit = calorieAdjustment > 0;

  return (
    <CardContainer>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-200">Weight Goal</h3>
          <p className="text-gray-400 text-sm">
            {startingWeight && targetWeight ? (
              <>
                {directionText}{" "}
                {Math.abs(targetWeight - startingWeight).toFixed(1)} kg
              </>
            ) : (
              "Goal details"
            )}
          </p>
        </div>
        <div className="flex mt-3 md:mt-0 space-x-2">
          <button
            onClick={onEdit}
            className="flex items-center px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-md text-sm text-gray-300 transition-colors"
          >
            <EditIcon className="w-4 h-4 mr-1.5" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 rounded-md text-sm text-red-300 transition-colors"
          >
            <TrashIcon className="w-4 h-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-gray-800/30 p-3 rounded-md">
          <div className="text-sm text-gray-400 mb-1">Starting Weight</div>
          <div className="text-xl font-medium text-gray-100">
            {startingWeight !== null ? `${startingWeight} kg` : "Not set"}
          </div>
        </div>

        <div className="bg-gray-800/30 p-3 rounded-md">
          <div className="text-sm text-gray-400 mb-1">Target Weight</div>
          <div className="text-xl font-medium text-gray-100">
            {targetWeight !== null ? `${targetWeight} kg` : "Not set"}
          </div>
        </div>

        <div className="bg-gray-800/30 p-3 rounded-md">
          <div className="text-sm text-gray-400 mb-1">Daily Calories</div>
          <div className="text-xl font-medium text-gray-100">
            {calorieTarget !== null ? `${calorieTarget} kcal` : "Not set"}
          </div>
          {calorieTarget && tdee ? (
            <div className="text-xs text-gray-500 mt-0.5">
              {isDeficit ? (
                <span className="text-indigo-400">
                  {Math.abs(calorieAdjustment)} kcal deficit
                </span>
              ) : (
                <span className="text-green-400">
                  {Math.abs(calorieAdjustment)} kcal surplus
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="bg-gray-800/30 p-3 rounded-md">
          <div className="text-sm text-gray-400 mb-1">Timeline</div>
          <div className="text-xl font-medium text-gray-100">
            {daysRemaining !== null
              ? `${daysRemaining} days left`
              : "No end date"}
          </div>
          {startDate && targetDate ? (
            <div className="text-xs text-gray-500 mt-0.5">
              {formattedStartDate} – {formattedTargetDate}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-300 font-medium">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <ProgressBar
          progress={progressPercentage}
          variant={directionText === "Losing" ? "weight-loss" : "weight-gain"}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            {startingWeight !== null
              ? `${startingWeight} kg (start)`
              : "Starting"}
          </span>
          <span>
            {weightRemaining > 0
              ? `${weightRemaining.toFixed(1)} kg to go`
              : "Goal reached!"}
          </span>
          <span>
            {targetWeight !== null ? `${targetWeight} kg (goal)` : "Target"}
          </span>
        </div>
      </div>

      {insight && (
        <div className="mt-3 bg-indigo-900/20 border border-indigo-800/30 rounded-md p-3 text-sm text-indigo-100">
          {insight}
        </div>
      )}
    </CardContainer>
  );
}

export default WeightGoalDetails;
