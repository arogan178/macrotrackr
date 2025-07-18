/**
 * Updated HabitTracker component demonstrating the new loading state patterns
 * This shows how to migrate from manual loading state handling to the new hooks and components
 */

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { ProFeature } from "@/components/billing/ProFeature";
import { FormButton } from "@/components/form";
import {
  CheckCircleIcon,
  CheckIcon,
  FeatureLoadingIndicator,
  MutationLoadingButton,
  PlusIcon,
  QueryLoadingWrapper,
  TargetIcon,
} from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSubscriptionStatus } from "@/features/pricing/hooks/useSubscriptionStatus";
import {
  useFeatureLoading,
  useMutationErrorHandler,
  useSpecificMutationLoading,
} from "@/hooks";

import { HABIT_ICONS } from "../constants";
import { HabitGoal } from "../types/types";
import HabitActions from "./HabitActions";

interface HabitTrackerUpdatedProps {
  habits: HabitGoal[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onAddHabit?: () => void;
  onIncrementHabit?: (id: string) => Promise<void>;
  onCompleteHabit?: (id: string) => Promise<void>;
  onEditHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => Promise<void>;
}

function HabitTrackerUpdated({
  habits,
  isLoading = false,
  isError = false,
  error = null,
  onAddHabit,
  onIncrementHabit,
  onCompleteHabit,
  onEditHabit,
  onDeleteHabit,
}: HabitTrackerUpdatedProps) {
  const { subscriptionStatus } = useSubscriptionStatus();
  const isPro = subscriptionStatus === "pro";
  const canAddHabit = isPro || habits.length < 2;

  // Use the new loading state hooks
  const { isMutationLoading: isHabitMutationLoading } =
    useFeatureLoading("habits");
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => console.error("Habit operation failed:", message),
      onSuccess: (message) =>
        console.log("Habit operation succeeded:", message),
    });

  // Custom loading skeleton component
  const HabitLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((index) => (
        <div key={index} className="bg-gray-700/30 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-600/20 to-gray-600/5 p-3">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-600/30 animate-pulse mr-2"></div>
              <div className="h-5 w-24 bg-gray-600/30 animate-pulse rounded"></div>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-6 w-16 bg-gray-600/30 animate-pulse rounded"></div>
              <div className="h-4 w-8 bg-gray-600/30 animate-pulse rounded"></div>
            </div>
            <div className="h-2 bg-gray-600/30 animate-pulse rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg">
      <div className="p-5">
        {/* Header with title and add button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-200 flex items-center">
            <CheckCircleIcon size="md" className="mr-2 text-purple-400" />
            Habit Goals
          </h3>

          {/* Only show Add button in header if NOT showing empty state */}
          {onAddHabit && habits.length > 0 && (
            <div className={canAddHabit ? "" : "relative"}>
              <ProFeature>
                <MutationLoadingButton
                  isLoading={isHabitMutationLoading}
                  loadingText="Adding..."
                  onClick={onAddHabit}
                  disabled={!canAddHabit}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  <div className="flex items-center space-x-1">
                    <PlusIcon />
                    <span>Add Habit</span>
                  </div>
                </MutationLoadingButton>
              </ProFeature>
            </div>
          )}
        </div>

        {/* Use QueryLoadingWrapper for comprehensive state handling */}
        <QueryLoadingWrapper
          isLoading={isLoading}
          isError={isError}
          error={error}
          loadingComponent={<HabitLoadingSkeleton />}
          errorComponent={
            <div className="text-center py-8">
              <div className="text-red-400 mb-2">Failed to load habits</div>
              <div className="text-gray-400 text-sm">
                {error?.message || "Please try again"}
              </div>
            </div>
          }
        >
          {habits.length === 0 ? (
            <EmptyState
              title="Start Building Habits"
              message="Add your first habit goal to begin tracking your progress."
              icon={
                <div className="rounded-full bg-gray-800 p-4 inline-block">
                  <CheckCircleIcon className="h-10 w-10 text-gray-500" />
                </div>
              }
              action={
                onAddHabit && (
                  <div className={canAddHabit ? "" : "relative"}>
                    <ProFeature>
                      <MutationLoadingButton
                        isLoading={isHabitMutationLoading}
                        loadingText="Adding..."
                        onClick={onAddHabit}
                        disabled={!canAddHabit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-2">
                          <PlusIcon />
                          <span>Add Your First Habit</span>
                        </div>
                      </MutationLoadingButton>
                    </ProFeature>
                  </div>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onIncrement={onIncrementHabit}
                  onComplete={onCompleteHabit}
                  onEdit={onEditHabit}
                  onDelete={onDeleteHabit}
                />
              ))}
            </div>
          )}
        </QueryLoadingWrapper>
      </div>
    </div>
  );
}

// Individual habit card component with mutation loading states
interface HabitCardProps {
  habit: HabitGoal;
  onIncrement?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

function HabitCard({
  habit,
  onIncrement,
  onComplete,
  onEdit,
  onDelete,
}: HabitCardProps) {
  // Check loading state for specific mutations
  const { isLoading: isIncrementLoading } = useSpecificMutationLoading([
    "habits",
    "increment",
    habit.id,
  ]);
  const { isLoading: isCompleteLoading } = useSpecificMutationLoading([
    "habits",
    "complete",
    habit.id,
  ]);
  const { isLoading: isDeleteLoading } = useSpecificMutationLoading([
    "habits",
    "delete",
    habit.id,
  ]);

  const IconComponent = HABIT_ICONS[habit.icon] || TargetIcon;
  const isComplete = habit.isComplete;
  const progress = Math.round((habit.current / habit.target) * 100);

  return (
    <div className="bg-gray-700/30 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-600/20 to-gray-600/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-600/50 flex items-center justify-center mr-2">
              <IconComponent className="w-4 h-4 text-gray-300" />
            </div>
            <span className="text-gray-200 font-medium">{habit.name}</span>
          </div>

          <HabitActions
            habit={habit}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleteLoading={isDeleteLoading}
          />
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <AnimatedNumber
              value={habit.current}
              className="text-xl font-bold text-white"
            />
            <span className="text-gray-400">/ {habit.target}</span>
          </div>
          <span className="text-sm text-gray-400">{progress}%</span>
        </div>

        <ProgressBar progress={progress} className="mb-3" />

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!isComplete && onIncrement && (
              <MutationLoadingButton
                isLoading={isIncrementLoading}
                loadingText="Adding..."
                onClick={() => onIncrement(habit.id)}
                className="bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <div className="flex items-center space-x-1">
                  <PlusIcon className="w-3 h-3" />
                  <span>+1</span>
                </div>
              </MutationLoadingButton>
            )}

            {!isComplete && habit.current < habit.target && onComplete && (
              <MutationLoadingButton
                isLoading={isCompleteLoading}
                loadingText="Completing..."
                onClick={() => onComplete(habit.id)}
                className="bg-green-600/80 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <div className="flex items-center space-x-1">
                  <CheckIcon className="w-3 h-3" />
                  <span>Complete</span>
                </div>
              </MutationLoadingButton>
            )}
          </div>

          {isComplete && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckIcon className="w-4 h-4 mr-1" />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HabitTrackerUpdated;
