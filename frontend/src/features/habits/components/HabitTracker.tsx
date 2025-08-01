import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { ProFeature } from "@/components/billing/ProFeature";
import { CardContainer } from "@/components/form";
import {
  Button,
  CheckCircleIcon,
  CheckIcon,
  PlusIcon,
  TargetIcon,
} from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSubscriptionStatus } from "@/features/billing/hooks/useSubscriptionStatus";

import { HABIT_ICONS } from "../constants";
import { HabitGoal } from "../types/types";
import HabitActions from "./HabitActions";

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
  const isPro = subscriptionStatus === "pro";
  const canAddHabit = isPro || habits.length < 2;

  return (
    <CardContainer>
      <div className="p-5">
        {/* Header with title and add button */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-lg font-medium text-foreground">
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
                  autoLoadingFeature="habits"
                  loadingText="Adding..."
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-primary transition-colors hover:text-primary disabled:opacity-50"
                  text="Add Habit"
                  icon={<PlusIcon />}
                  iconPosition="left"
                />
              </ProFeature>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg bg-surface/30"
              >
                <div className="bg-gradient-to-r from-gray-600/20 to-gray-600/5 p-3">
                  <div className="mb-2 flex items-center">
                    <div className="mr-2 h-8 w-8 animate-pulse rounded-lg bg-surface/30"></div>
                    <div className="h-5 w-24 animate-pulse rounded bg-surface/30"></div>
                  </div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="h-6 w-16 animate-pulse rounded bg-surface/30"></div>
                    <div className="h-4 w-8 animate-pulse rounded bg-surface/30"></div>
                  </div>
                  <div className="h-2 animate-pulse rounded-full bg-surface/30"></div>
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
              <div className="inline-block rounded-full bg-surface p-4">
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
            className="rounded-lg bg-surface/30"
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
      </div>
    </CardContainer>
  );
}

interface HabitCardProps {
  habit: HabitGoal;
  onIncrement?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

function getGradientClass(color: string) {
  const gradients = {
    indigo: "from-primary/20 to-primary/5",
    blue: "from-primary/20 to-primary/5",
    green: "from-green-500/20 to-green-500/5",
    purple: "from-purple-500/20 to-purple-500/5",
  } as const;
  return gradients[color as keyof typeof gradients] || gradients.indigo;
}

function getAccentClass(color: string) {
  const colors = {
    indigo: "text-vibrant-accent bg-primary/10",
    blue: "text-blue-400 bg-blue-400/10",
    green: "text-success bg-success/10",
    purple: "text-purple-400 bg-purple-400/10",
  } as const;
  return colors[color as keyof typeof colors] || colors.indigo;
}

// Limit ProgressBar color to allowed union for type safety
function resolveProgressColor(
  accentColor: string,
  isComplete: boolean | undefined,
):
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "accent"
  | "protein"
  | "carbs"
  | "fats" {
  if (isComplete) return "green";
  // Map known habit accent colors to allowed union; default to accent
  switch (accentColor) {
    case "green": {
      return "green";
    }
    case "purple": {
      return "purple";
    }
    case "blue": {
      return "blue";
    }
    case "vibrant-accent":
    case "accent": {
      return "accent";
    }
    default: {
      return "accent";
    }
  }
}

function HabitCard({
  habit,
  onIncrement,
  onComplete,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const {
    id,
    title,
    iconName,
    current,
    target,
    progress,
    accentColor = "vibrant-accent",
    isComplete = false,
  } = habit;

  // Render the icon based on iconName
  const renderIcon = () => {
    const IconComponent =
      HABIT_ICONS[iconName as keyof typeof HABIT_ICONS] || TargetIcon;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    // Add overflow-hidden to the outer container
    <div className="overflow-hidden rounded-lg bg-surface/30">
      {/* Move all card content INSIDE the gradient div */}
      <div className={`bg-gradient-to-r ${getGradientClass(accentColor)} p-3`}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`rounded-lg p-1.5 ${getAccentClass(accentColor)} mr-2`}
            >
              {renderIcon()}
            </div>
            <h4 className="mr-2 font-medium text-foreground">{title}</h4>
          </div>

          {isComplete && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
              <CheckIcon size="sm" />
              Complete
            </span>
          )}

          {/* Actions menu - only show if handlers are provided */}
          {(onIncrement || onComplete || onEdit || onDelete) && (
            <div className="ml-auto">
              <HabitActions
                habitId={id}
                isComplete={isComplete}
                onIncrement={onIncrement || (async () => {})}
                onComplete={onComplete || (async () => {})}
                onEdit={onEdit}
                onDelete={onDelete || (async () => {})}
              />
            </div>
          )}
        </div>

        <div className="mb-1.5 flex items-center justify-between">
          {" "}
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">
              <AnimatedNumber value={current} />
            </span>
            <span className="text-sm text-foreground">
              / <AnimatedNumber value={target} />
            </span>
          </div>{" "}
          {!isComplete && (
            <span className="text-sm text-foreground">
              <AnimatedNumber value={progress} suffix="%" />
            </span>
          )}
        </div>

        <ProgressBar
          progress={progress}
          color={resolveProgressColor(accentColor, isComplete)}
          height="sm"
        />
      </div>{" "}
      {/* Close the gradient div */}
    </div>
  );
}

export default HabitTracker;
