import { memo, ReactNode } from "react";

import Button from "./Button";
import { PlusIcon } from "./Icons";

interface ActionProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: ReactNode;
}

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ActionProps;
  secondaryAction?: ActionProps;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function getButtonStyles(_variant: ActionProps["variant"] = "primary") {
  return "";
}

function EmptyState({
  title,
  message,
  icon,
  action,
  secondaryAction,
  className = "",
  size = "md",
}: EmptyStateProps) {
  // Size-based styles
  const sizeStyles = {
    sm: {
      padding: "py-4",
      iconSize: "h-10 w-10",
      title: "text-base",
      message: "text-xs max-w-xs",
    },
    md: {
      padding: "py-8",
      iconSize: "h-14 w-14",
      title: "text-lg",
      message: "text-sm max-w-md",
    },
    lg: {
      padding: "py-12",
      iconSize: "h-20 w-20",
      title: "text-xl",
      message: "text-base max-w-lg",
    },
  }[size];

  // Default icon if none provided
  const defaultIcon = (
    <PlusIcon
      className={`${sizeStyles.iconSize} text-muted`}
      strokeWidth={1.5}
    />
  );

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizeStyles.padding} px-4 ${className}`}
    >
      <div className="mb-4 text-muted">
        {icon || (
          <div className="inline-block rounded-full bg-surface-2 p-4">
            {defaultIcon}
          </div>
        )}
      </div>

      <h3 className={`${sizeStyles.title} mb-2 font-medium text-foreground`}>
        {title}
      </h3>
      <p className={`${sizeStyles.message} mb-6 text-muted`}>{message}</p>

      {/* Icon buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap justify-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              ariaLabel={action.label}
              variant={
                action.variant === "secondary"
                  ? "secondary"
                  : action.variant === "outline"
                    ? "ghost"
                    : "primary"
              }
              className={getButtonStyles(action.variant)}
              icon={action.icon}
              iconPosition="left"
            >
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              ariaLabel={secondaryAction.label}
              variant={
                secondaryAction.variant === "secondary"
                  ? "secondary"
                  : secondaryAction.variant === "outline"
                    ? "ghost"
                    : "primary"
              }
              className={getButtonStyles(secondaryAction.variant || "outline")}
              icon={secondaryAction.icon}
              iconPosition="left"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(EmptyState);
