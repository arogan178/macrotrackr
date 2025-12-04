import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { CheckIcon, TargetIcon } from "@/components/ui";
import ProgressBar from "@/components/ui/ProgressBar";
import type { HabitGoal } from "@/types/habit";

import { HABIT_ICONS } from "../../constants/habits";
import HabitActions from "./HabitActions";

type Variant = "sm" | "md";

/* ProgressBar will use fillClass override to color-match the selected accent color */

interface HabitCardActions {
  onIncrement?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

interface HabitCardShowToggles {
  title?: boolean;
  numbers?: boolean;
  percentage?: boolean;
  progressBar?: boolean;
  completionBadge?: boolean;
}

interface HabitCardPropsShared {
  habit: Partial<HabitGoal> & {
    title: string;
    iconName: string;
    current: number;
    target: number;
    progress?: number;
    accentColor?: string;
    isComplete?: boolean;
    id?: string;
  };
  variant?: Variant;
  show?: HabitCardShowToggles;
  actions?: HabitCardActions;
}

function getGradientClass(color: string | undefined) {
  const gradients = {
    indigo: "from-indigo-500/20 to-indigo-500/5",
    blue: "from-blue-500/20 to-blue-500/5",
    cyan: "from-cyan-500/20 to-cyan-500/5",
    teal: "from-teal-500/20 to-teal-500/5",
    green: "from-green-500/20 to-green-500/5",
    lime: "from-lime-500/20 to-lime-500/5",
    yellow: "from-yellow-500/20 to-yellow-500/5",
    orange: "from-orange-500/20 to-orange-500/5",
    red: "from-red-500/20 to-red-500/5",
    pink: "from-pink-500/20 to-pink-500/5",
    purple: "from-purple-500/20 to-purple-500/5",
    "vibrant-accent": "from-vibrant-accent/20 to-vibrant-accent/5",
    accent: "from-vibrant-accent/20 to-vibrant-accent/5",
  } as const;
  return (
    gradients[(color as keyof typeof gradients) || "indigo"] || gradients.indigo
  );
}

function getAccentClass(color: string | undefined) {
  const colors = {
    indigo: "text-indigo-500 bg-indigo-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    cyan: "text-cyan-500 bg-cyan-500/10",
    teal: "text-teal-500 bg-teal-500/10",
    green: "text-green-500 bg-green-500/10",
    lime: "text-lime-500 bg-lime-500/10",
    yellow: "text-yellow-500 bg-yellow-500/10",
    orange: "text-orange-500 bg-orange-500/10",
    red: "text-red-500 bg-red-500/10",
    pink: "text-pink-500 bg-pink-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    "vibrant-accent": "text-vibrant-accent bg-vibrant-accent/10",
    accent: "text-vibrant-accent bg-vibrant-accent/10",
  } as const;
  return colors[(color as keyof typeof colors) || "indigo"] || colors.indigo;
}

/* Direct Tailwind color mapping for the ProgressBar fill, matching user-selected color */
function getBarFillClass(color: string | undefined): string {
  const fills = {
    indigo: "bg-indigo-500",
    blue: "bg-blue-500",
    cyan: "bg-cyan-500",
    teal: "bg-teal-500",
    green: "bg-green-500",
    lime: "bg-lime-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    pink: "bg-pink-500",
    purple: "bg-purple-500",
    "vibrant-accent": "bg-vibrant-accent",
    accent: "bg-vibrant-accent",
  } as const;
  return fills[(color as keyof typeof fills) || "indigo"] || fills.indigo;
}

function computeProgress(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export default function HabitCard({
  habit,
  variant = "md",
  show,
  actions,
}: HabitCardPropsShared) {
  const {
    id,
    title,
    iconName,
    current,
    target,
    progress: progressValue,
    accentColor = "vibrant-accent",
    isComplete = false,
  } = habit;

  const defaultsByVariant: Record<Variant, HabitCardShowToggles> = {
    sm: {
      title: true,
      numbers: true,
      percentage: true,
      progressBar: true,
      completionBadge: false,
    },
    md: {
      title: true,
      numbers: true,
      percentage: true,
      progressBar: true,
      completionBadge: true,
    },
  };

  const resolvedShow: HabitCardShowToggles = {
    ...defaultsByVariant[variant],
    ...show,
  };

  const progress =
    typeof progressValue === "number"
      ? progressValue
      : computeProgress(current, target);

  const IconComponent =
    HABIT_ICONS[iconName as keyof typeof HABIT_ICONS] || TargetIcon;

  // Size styles
  const numberClass = variant === "sm" ? "text-lg" : "text-xl";
  const paddingClass = "p-3";
  const iconWrapperPadding = "p-1.5";

  return (
    <div className="overflow-hidden rounded-lg bg-surface/30">
      <div
        className={`bg-gradient-to-r ${getGradientClass(accentColor)} ${paddingClass}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`mr-2 rounded-lg ${iconWrapperPadding} ${getAccentClass(accentColor)}`}
            >
              <IconComponent
                className={variant === "sm" ? "h-4 w-4" : "h-4 w-4"}
              />
            </div>
            {resolvedShow.title && (
              <h4 className="mr-2 font-medium text-foreground">{title}</h4>
            )}
          </div>

          {resolvedShow.completionBadge && isComplete && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
              <CheckIcon size="sm" />
              Complete
            </span>
          )}

          {actions &&
            id &&
            (actions.onIncrement ||
              actions.onComplete ||
              actions.onEdit ||
              actions.onDelete) && (
              <div className="ml-auto">
                <HabitActions
                  habitId={id}
                  isComplete={isComplete}
                  onIncrement={actions.onIncrement || (async () => {})}
                  onComplete={actions.onComplete || (async () => {})}
                  onEdit={actions.onEdit}
                  onDelete={actions.onDelete || (async () => {})}
                />
              </div>
            )}
        </div>

        {(resolvedShow.numbers || resolvedShow.percentage) && (
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              {resolvedShow.numbers && (
                <span className={`${numberClass} font-bold text-foreground`}>
                  {variant === "sm" ? (
                    <span>{current}</span>
                  ) : (
                    <AnimatedNumber value={current} />
                  )}
                </span>
              )}
              {resolvedShow.numbers && (
                <span className="text-sm text-foreground">
                  /{" "}
                  {variant === "sm" ? (
                    target
                  ) : (
                    <AnimatedNumber value={target} />
                  )}
                </span>
              )}
            </div>
            {!isComplete && resolvedShow.percentage && (
              <span className="text-sm text-foreground">
                {variant === "sm" ? (
                  `${progress}%`
                ) : (
                  <AnimatedNumber value={progress} suffix="%" />
                )}
              </span>
            )}
          </div>
        )}

        {resolvedShow.progressBar && (
          <ProgressBar
            progress={progress}
            /* Use fillClass to color the bar directly from accentColor */
            fillClass={getBarFillClass(accentColor)}
            height="sm"
            showPercentage={false}
          />
        )}
      </div>
    </div>
  );
}
