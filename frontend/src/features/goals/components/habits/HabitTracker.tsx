import { ProFeature } from "@/components/billing/ProFeature";
import CardContainer from "@/components/form/CardContainer";
import { Button, CheckCircleIcon, PlusIcon } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import { isLocalAuthMode } from "@/config/runtime";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { HabitGoal } from "@/types/habit";

import HabitCard from "./HabitCard";

interface HabitTrackerProps {
  habits: HabitGoal[];
  isLoading?: boolean;
  onAddHabit?: () => void;
  onIncrementHabit?: (id: string) => Promise<void>;
  onCompleteHabit?: (id: string) => Promise<void>;
  onEditHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => Promise<void>;
}

function HabitTracker({
  habits,
  isLoading = false,
  onAddHabit,
  onIncrementHabit,
  onCompleteHabit,
  onEditHabit,
  onDeleteHabit,
}: HabitTrackerProps) {
  const { subscriptionStatus } = useSubscriptionStatus();
  const isPro = isLocalAuthMode || subscriptionStatus === "pro";
  const canAddHabit = isPro || habits.length < 2;

  return (
    <CardContainer>
      <div className="p-5">
        {/* Header with title and add button */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-lg font-semibold tracking-tight text-foreground/90">
            <CheckCircleIcon size="md" className="mr-2 text-purple-400" />
            Habit Goals
          </h3>

          {/* Only show Add button in header if NOT showing empty state */}
          {onAddHabit && habits.length > 0 && (
            <div className={canAddHabit ? "" : "relative"}>
              <ProFeature>
                <Button
                  variant="ghost"
                  onClick={onAddHabit}
                  disabled={!canAddHabit}
                  text="Add Habit"
                  leftIcon={<PlusIcon />}
                />
              </ProFeature>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-surface-2"
              >
                <div className="p-4">
                  <div className="mb-4 flex items-center">
                    <div className="mr-3 h-10 w-10 animate-pulse rounded-xl bg-surface-3" />
                    <div className="h-5 w-24 animate-pulse rounded bg-surface-3" />
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-6 w-16 animate-pulse rounded bg-surface-3" />
                    <div className="h-4 w-8 animate-pulse rounded bg-surface-3" />
                  </div>
                  <div className="h-2 animate-pulse rounded-full bg-surface-3" />
                </div>
              </div>
            ))}
          </div>
        ) : habits.length === 0 ? (
          // Use EmptyState component
          <EmptyState
            title="Start Building Habits"
            message="Add your first habit goal to begin tracking your progress."
            icon={
              <div className="inline-block rounded-2xl bg-surface p-4">
                <CheckCircleIcon className="h-10 w-10 text-foreground" />
              </div>
            }
            action={
              onAddHabit
                ? {
                    label: "Add First Habit",
                    onClick: onAddHabit,
                    variant: "primary",
                    icon: <PlusIcon size="sm" />,
                  }
                : undefined
            }
            size="md"
            className="rounded-2xl border border-border/60 bg-surface-2"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                actions={{
                  onIncrement: onIncrementHabit,
                  onComplete: onCompleteHabit,
                  onEdit: onEditHabit,
                  onDelete: onDeleteHabit,
                }}
                variant="md"
              />
            ))}
          </div>
        )}
      </div>
    </CardContainer>
  );
}

export default HabitTracker;
