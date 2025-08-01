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
      <div className="mb-4 flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Weight Goal</h3>
          <p className="text-sm text-foreground">
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
        <div className="mt-3 flex space-x-2 md:mt-0">
          <button
            onClick={onEdit}
            className="flex items-center rounded-md bg-surface/50 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface"
          >
            <EditIcon className="mr-1.5 h-4 w-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center rounded-md bg-error/30 px-3 py-1.5 text-sm text-error transition-colors hover:bg-error/50"
          >
            <TrashIcon className="mr-1.5 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md bg-surface/30 p-3">
          <div className="mb-1 text-sm text-foreground">Starting Weight</div>
          <div className="text-xl font-medium text-foreground">
            {startingWeight === undefined ? "Not set" : `${startingWeight} kg`}
          </div>
        </div>

        <div className="rounded-md bg-surface/30 p-3">
          <div className="mb-1 text-sm text-foreground">Target Weight</div>
          <div className="text-xl font-medium text-foreground">
            {targetWeight === undefined ? "Not set" : `${targetWeight} kg`}
          </div>
        </div>

        <div className="rounded-md bg-surface/30 p-3">
          <div className="mb-1 text-sm text-foreground">Daily Calories</div>
          <div className="text-xl font-medium text-foreground">
            {calorieTarget === undefined ? "Not set" : `${calorieTarget} kcal`}
          </div>
          {calorieTarget && tdee ? (
            <div className="mt-0.5 text-xs text-foreground">
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

        <div className="rounded-md bg-surface/30 p-3">
          <div className="mb-1 text-sm text-foreground">Timeline</div>
          <div className="text-xl font-medium text-foreground">
            {daysRemaining === undefined
              ? "No end date"
              : `${daysRemaining} days left`}
          </div>
          {startDate && targetDate ? (
            <div className="mt-0.5 text-xs text-foreground">
              {formattedStartDate} – {formattedTargetDate}
            </div>
          ) : undefined}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <ProgressBar progress={progressPercentage} />
        <div className="mt-1 flex justify-between text-xs text-foreground">
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
        <div className="mt-3 rounded-md border border-primary/30 bg-primary/20 p-3 text-sm text-primary">
          {insight}
        </div>
      )}
    </CardContainer>
  );
}

export default WeightGoalDetails;
