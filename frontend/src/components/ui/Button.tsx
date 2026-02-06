import React, { memo } from "react";

import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  DEFAULT_LOADING_TEXT,
  ICON_POSITIONS,
} from "@/components/utils";
import { useFeatureLoading, useGlobalLoading } from "@/hooks";

import { LoadingSpinnerIcon } from "./Icons";
// Fixed type import path: Types are defined in ./Types.ts, not "@/components/ui/types"
import type { ButtonProps } from "./Types";

type ButtonAllProps = ButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

function ButtonBase({
  children,
  text,
  type = "button",
  variant = BUTTON_VARIANTS.PRIMARY,
  buttonSize = "md",
  icon,
  iconPosition = ICON_POSITIONS.RIGHT,
  isLoading = false,
  loadingText = DEFAULT_LOADING_TEXT,
  disabled = false,
  className = "",
  onClick,
  fullWidth = false,
  ariaLabel,
  ...rest
}: Omit<ButtonAllProps, "autoLoadingFeature" | "autoLoadingGlobal">) {
  const finalIsLoading = isLoading;

  // Localized button styles (migrated from utils/Styles.ts)
  const sizeStyles = BUTTON_SIZES;

  const buttonBase =
    "inline-flex items-center justify-center font-medium text-sm gap-1.5 " +
    "transition-colors duration-150 ease-out " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const buttonVariants: Record<string, string> = {
    primary:
      "bg-primary text-background hover:bg-primary/85 active:bg-primary/70 " +
      "disabled:hover:bg-primary focus-visible:outline-primary",
    secondary:
      "bg-surface-3 text-foreground border border-border hover:bg-surface-4 active:bg-surface-2 " +
      "disabled:hover:bg-surface-3 focus-visible:outline-primary",
    danger:
      "bg-error/15 text-error border border-error/25 hover:bg-error/25 active:bg-error/35 " +
      "disabled:hover:bg-error/15 focus-visible:outline-error",
    success:
      "bg-success/15 text-success border border-success/25 hover:bg-success/25 active:bg-success/35 " +
      "disabled:hover:bg-success/15 focus-visible:outline-success",
    ghost:
      "bg-transparent text-muted hover:bg-surface-2 hover:text-foreground active:bg-surface-3 " +
      "disabled:hover:bg-transparent focus-visible:outline-primary",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  const buttonClasses = [
    buttonBase,
    sizeStyles[buttonSize as keyof typeof sizeStyles],
    buttonVariants[variant],
    widthStyles,
    className,
  ].join(" ");

  const renderContent = () => {
    if (finalIsLoading) {
      return (
        <span className="flex items-center justify-center">
          <LoadingSpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </span>
      );
    }
    // Always render icon if provided, even with children
    const content = children || text;
    return (
      <span className="flex items-center justify-center">
        {icon && iconPosition === ICON_POSITIONS.LEFT && (
          <span className="mr-2 flex items-center">{icon}</span>
        )}
        {content && <span>{content}</span>}
        {icon && iconPosition === ICON_POSITIONS.RIGHT && (
          <span className="ml-2 flex items-center">{icon}</span>
        )}
      </span>
    );
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={finalIsLoading || disabled}
      className={buttonClasses}
      aria-busy={finalIsLoading}
      aria-label={ariaLabel || text}
      data-variant={variant}
      {...rest}
    >
      {renderContent()}
    </button>
  );
}

// Unified Button that ensures hooks are always called in a stable order
function Button(properties: ButtonAllProps) {
  const {
    autoLoadingFeature,
    autoLoadingGlobal = false,
    isLoading = false,
    ...rest
  } = properties;

  // Always call hooks at top-level and in the same order
  const globalLoading = useGlobalLoading();
  // Call feature loading hook unconditionally with a stable argument.
  // If no feature is provided, default to "settings" which is a safe feature bucket in this app.
  // We won't use its value unless autoLoadingFeature is set.
  const featureKey = (autoLoadingFeature ?? "settings") as Parameters<
    typeof useFeatureLoading
  >[0];
  const featureLoading = useFeatureLoading(featureKey);

  const globalMutation = autoLoadingGlobal
    ? globalLoading.isMutationLoading
    : false;
  const featureMutation = autoLoadingFeature
    ? featureLoading.isMutationLoading
    : false;

  const final = isLoading || featureMutation || globalMutation;

  return <ButtonBase {...rest} isLoading={final} />;
}

export default memo(Button);
