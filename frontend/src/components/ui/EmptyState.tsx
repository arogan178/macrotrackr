import { memo, ReactNode } from "react";

import { FormButton } from "@/components/form";
import { PlusIcon } from "@/components/ui";

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

function getButtonStyles(variant: ActionProps["variant"] = "primary") {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center";

  switch (variant) {
    case "primary": {
      return `${baseStyles} bg-indigo-600 hover:bg-indigo-700 text-white`;
    }
    case "secondary": {
      return `${baseStyles} bg-gray-700 hover:bg-gray-600 text-white`;
    }
    case "outline": {
      return `${baseStyles} border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white`;
    }
    default: {
      return `${baseStyles} bg-indigo-600 hover:bg-indigo-700 text-white`;
    }
  }
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
      className={`${sizeStyles.iconSize} text-gray-500`}
      strokeWidth={1.5}
    />
  );

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizeStyles.padding} px-4 ${className}`}
    >
      <div className="mb-4 text-gray-400">
        {icon || (
          <div className="rounded-full bg-gray-800 p-4 inline-block">
            {defaultIcon}
          </div>
        )}
      </div>

      <h3 className={`${sizeStyles.title} font-medium text-gray-200 mb-2`}>
        {title}
      </h3>
      <p className={`${sizeStyles.message} text-gray-400 mb-6`}>{message}</p>

      {/* Action buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap justify-center gap-3">
          {action && (
            <FormButton
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
            </FormButton>
          )}

          {secondaryAction && (
            <FormButton
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
            </FormButton>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(EmptyState);
