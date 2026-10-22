import { TargetIcon } from "@/components/ui";
import ProgressBar from "@/components/ui/ProgressBar";
import { CHIP } from "@/features/macroTracking/components/TargetRow";
import { cn } from "@/lib/classnameUtilities";
import type { HabitGoal } from "@/types/habit";

import { HABIT_ICONS } from "../../constants/habits";

import HabitActions from "./HabitActions";

type Variant = "sm" | "md";

/* ProgressBar will use fillClass override to color-match the selected accent color */

interface HabitCardActions {
  onIncrement?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onDecrement?: (id: string) => Promise<void>;
  onReset?: (id: string) => Promise<void>;
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
    "primary": "text-primary bg-primary/10",
    accent: "text-primary bg-primary/10",
  } as const;

  return colors[(color as keyof typeof colors) ?? "indigo"] ?? colors.indigo;
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
    "primary": "bg-primary",
    accent: "bg-primary",
  } as const;

  return fills[(color as keyof typeof fills) ?? "indigo"] ?? fills.indigo;
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
    accentColor = "primary",
    isComplete = false,
    frequency,
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
    HABIT_ICONS[iconName as keyof typeof HABIT_ICONS] ?? TargetIcon;

  const numberClass = variant === "sm" ? "text-lg" : "text-xl";
  const iconWrapperPadding = variant === "sm" ? "p-1.5" : "p-2";

  return (
    // A habit is a row in a list, not a tinted card: the icon and the bar
    // carry its colour.
    <div className={variant === "sm" ? "py-3" : "py-4"}>
        {/* The actions wrap onto their own row when the title would not fit beside them */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-auto items-center">
            <div
              className={cn(
                "mr-3 shrink-0 rounded-control",
                iconWrapperPadding,
                getAccentClass(accentColor)
              )}
            >
              <IconComponent
                className={variant === "sm" ? "h-4 w-4" : "h-5 w-5"}
              />
            </div>
            {resolvedShow.title && (
              <h4 className="min-w-0 font-semibold tracking-tight text-foreground/90">{title}</h4>
            )}
          </div>

          {actions &&
            id &&
            (actions.onIncrement ??
              actions.onComplete ??
              actions.onEdit ??
              actions.onDelete) && (
              <div className="ml-auto">
                <HabitActions
                  habitId={id}
                  current={current}
                  isComplete={isComplete}
                  frequency={frequency}
                    onIncrement={actions.onIncrement ?? (async () => {})}
                    onComplete={actions.onComplete ?? (async () => {})}
                    onDecrement={actions.onDecrement}
                    onReset={actions.onReset}
                    onEdit={actions.onEdit}
                    onDelete={actions.onDelete ?? (async () => {})}
                />
              </div>
            )}
        </div>

        {(resolvedShow.numbers ?? resolvedShow.percentage) && (
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              {resolvedShow.numbers && (
                <span className={cn(numberClass, "font-bold text-foreground")}>
                  {current}
                </span>
              )}
              {resolvedShow.numbers && (
                <span className="text-sm text-muted">
                  / {target}
                  {frequency === "weekly" && " this week"}
                </span>
              )}
            </div>
            {!isComplete && resolvedShow.percentage && (
              <span className="text-sm text-muted">
                {progress}%
              </span>
            )}
            {resolvedShow.completionBadge && isComplete && (
              <span className={cn(CHIP, "bg-primary/12 text-primary")}>Complete</span>
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
  );
}
