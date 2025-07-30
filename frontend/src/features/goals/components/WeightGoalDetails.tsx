import { CardContainer } from "@/components/form";
import { EditIcon, ProgressBar, TrashIcon } from "@/components/ui";
import { WeightGoals } from "@/types/goal";

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
  startingWeight: number | undefined,
  targetWeight: number | undefined,
) {
  if (startingWeight === undefined || targetWeight === undefined)
    return "Maintaining";
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
    startingWeight, // Changed from startingWeight to startingWeight
    targetWeight,
    calorieTarget,
    startDate,
    targetDate,
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
          (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : undefined;

  // Get direction text based on starting and target weights
  const directionText = getDirectionText(startingWeight, targetWeight);

  // Calculate calorie difference from TDEE
  const calorieAdjustment = tdee && calorieTarget ? tdee - calorieTarget : 0;
  const isDeficit = calorieAdjustment > 0;

  return (
    <CardContainer>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Weight Goal</h3>
          <p className="text-foreground text-sm">
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
            className="flex items-center px-3 py-1.5 bg-surface/50 hover:bg-surface rounded-md text-sm text-foreground transition-colors"
          >
            <EditIcon className="w-4 h-4 mr-1.5" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center px-3 py-1.5 bg-error/30 hover:bg-error/50 rounded-md text-sm text-error transition-colors"
          >
            <TrashIcon className="w-4 h-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-surface/30 p-3 rounded-md">
          <div className="text-sm text-foreground mb-1">Starting Weight</div>
          <div className="text-xl font-medium text-foreground">
            {startingWeight === undefined ? "Not set" : `${startingWeight} kg`}
          </div>
        </div>

        <div className="bg-surface/30 p-3 rounded-md">
          <div className="text-sm text-foreground mb-1">Target Weight</div>
          <div className="text-xl font-medium text-foreground">
            {targetWeight === undefined ? "Not set" : `${targetWeight} kg`}
          </div>
        </div>

        <div className="bg-surface/30 p-3 rounded-md">
          <div className="text-sm text-foreground mb-1">Daily Calories</div>
          <div className="text-xl font-medium text-foreground">
            {calorieTarget === undefined ? "Not set" : `${calorieTarget} kcal`}
          </div>
          {calorieTarget && tdee ? (
            <div className="text-xs text-foreground mt-0.5">
              {isDeficit ? (
                <span className="text-primary">
                  {Math.abs(calorieAdjustment)} kcal deficit
                </span>
              ) : (
                <span className="text-success">
                  {Math.abs(calorieAdjustment)} kcal surplus
                </span>
              )}
            </div>
          ) : undefined}
        </div>

        <div className="bg-surface/30 p-3 rounded-md">
          <div className="text-sm text-foreground mb-1">Timeline</div>
          <div className="text-xl font-medium text-foreground">
            {daysRemaining === undefined
              ? "No end date"
              : `${daysRemaining} days left`}
          </div>
          {startDate && targetDate ? (
            <div className="text-xs text-foreground mt-0.5">
              {formattedStartDate} – {formattedTargetDate}
            </div>
          ) : undefined}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-foreground">Progress</span>
          <span className="text-foreground font-medium">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <ProgressBar progress={progressPercentage} />
        <div className="flex justify-between text-xs text-foreground mt-1">
          <span>
            {startingWeight === undefined
              ? "Starting"
              : `${startingWeight} kg (start)`}
          </span>
          <span>
            {weightRemaining > 0
              ? `${weightRemaining.toFixed(1)} kg to go`
              : "Goal reached!"}
          </span>
          <span>
            {targetWeight === undefined
              ? "Target"
              : `${targetWeight} kg (goal)`}
          </span>
        </div>
      </div>

      {insight && (
        <div className="mt-3 bg-primary/20 border border-primary/30 rounded-md p-3 text-sm text-primary">
          {insight}
        </div>
      )}
    </CardContainer>
  );
}

export default WeightGoalDetails;
