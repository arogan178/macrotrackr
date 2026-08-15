import { memo, type ReactNode } from "react";

import Heading from "@/components/ui/Heading";
import { cn } from "@/lib/classnameUtilities";

import Button from "./Button";
import { PlusIcon, WarningIcon } from "./Icons";

export type StateTone = "empty" | "error" | "offline";

interface StateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
}

interface StateCardProps {
  tone?: StateTone;
  title: string;
  message: string;
  icon?: ReactNode;
  action?: StateAction;
  secondaryAction?: StateAction;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { padding: "py-6", icon: "h-8 w-8", message: "max-w-xs" },
  md: { padding: "py-10", icon: "h-10 w-10", message: "max-w-md" },
  lg: { padding: "py-14", icon: "h-12 w-12", message: "max-w-lg" },
} as const;

const TONE_ICON_CLASS: Record<StateTone, string> = {
  empty: "text-muted",
  error: "text-error",
  offline: "text-warning",
};

/**
 * The one empty / error / offline state. There were seven treatments before
 * this — EmptyState, GoalsErrorState, two inline error paragraphs and three
 * bespoke panels — which is why a failed load looked different on every page.
 *
 * An empty state names the action rather than the absence: "Log your first
 * meal", not "No entries found".
 */
function StateCard({
  tone = "empty",
  title,
  message,
  icon,
  action,
  secondaryAction,
  size = "md",
  className,
}: StateCardProps) {
  const sizes = SIZES[size];
  const DefaultIcon = tone === "empty" ? PlusIcon : WarningIcon;

  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        sizes.padding,
        className,
      )}
    >
      <div className="mb-4">
        {icon ?? (
          <span className="inline-flex items-center justify-center rounded-full border border-border bg-surface-2 p-3.5">
            <DefaultIcon
              className={cn(sizes.icon, TONE_ICON_CLASS[tone])}
              strokeWidth={1.5}
            />
          </span>
        )}
      </div>

      <Heading level="panel" as="h3" className="mb-1.5">
        {title}
      </Heading>
      <p className={cn("mb-6 text-sm text-muted", sizes.message)}>{message}</p>

      {(action ?? secondaryAction) && (
        <div className="flex flex-wrap justify-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              ariaLabel={action.label}
              variant={action.variant ?? "primary"}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              ariaLabel={secondaryAction.label}
              variant={secondaryAction.variant ?? "secondary"}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(StateCard);
