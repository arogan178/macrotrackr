import React, { memo } from "react";

import { LoadingSpinnerIcon } from "@/components/ui";
import type { ButtonProps } from "@/components/ui/types";
import {
  BUTTON_VARIANTS,
  DEFAULT_LOADING_TEXT,
  FORM_BUTTON_SIZES,
  ICON_POSITIONS,
} from "@/components/utils";
import { useFeatureLoading, useGlobalLoading } from "@/hooks";

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
  const sizeStyles = FORM_BUTTON_SIZES;

  const buttonBase =
    "inline-flex items-center justify-center font-medium text-sm gap-1.5 transition-all duration-200 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
    "rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed";

  const buttonVariants: Record<string, string> = {
    primary:
      "bg-primary hover:bg-primary/50 disabled:hover:bg-primary text-foreground focus:ring-primary shadow-surface",
    secondary:
      "bg-secondary hover:bg-secondary/50 disabled:hover:bg-secondary text-foreground focus:ring-secondary shadow-surface",
    danger:
      "bg-error hover:bg-error/50 disabled:hover:bg-error text-foreground focus:ring-error shadow-surface",
    success:
      "bg-success hover:bg-success/50 disabled:hover:bg-success text-foreground focus:ring-success shadow-surface",
    ghost:
      "bg-transparent hover:bg-surface/50 disabled:hover:bg-transparent disabled:hover:text-foreground",
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

function ButtonWithAutoLoading(properties: ButtonAllProps) {
  const {
    autoLoadingFeature,
    autoLoadingGlobal = false,
    isLoading = false,
    ...rest
  } = properties;

  // Always call global hook to keep order stable
  const globalLoading = useGlobalLoading();

  // Render a child component that calls feature hook only when feature is provided
  function FeatureLoadingProbe({
    children,
  }: {
    children: (featureLoadingMutation: boolean) => React.ReactNode;
  }) {
    if (!autoLoadingFeature) {
      return <>{children(false)}</>;
    }
    const featureLoading = useFeatureLoading(autoLoadingFeature);
    return <>{children(featureLoading.isMutationLoading)}</>;
  }

  const globalMutation = autoLoadingGlobal
    ? globalLoading.isMutationLoading
    : false;

  return (
    <FeatureLoadingProbe>
      {(featureMutation) => {
        const final = isLoading || featureMutation || globalMutation;
        return <ButtonBase {...rest} isLoading={final} />;
      }}
    </FeatureLoadingProbe>
  );
}

function Button(properties: ButtonAllProps) {
  return <ButtonWithAutoLoading {...properties} />;
}

export default memo(Button);
