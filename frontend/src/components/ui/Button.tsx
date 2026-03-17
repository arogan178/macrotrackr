import React, { memo, useMemo } from "react";

import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  DEFAULT_LOADING_TEXT,
  ICON_POSITIONS,
} from "@/components/utils/Constants";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { cn } from "@/lib/classnameUtilities";

import { LoadingSpinnerIcon } from "./Icons";
import type { ButtonProps } from "./Types";

type ButtonAllProps = ButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function getButtonClasses(
  variant: string = BUTTON_VARIANTS.PRIMARY,
  buttonSize = "md",
  fullWidth = false,
  className = "",
): string {
  const sizeStyles = BUTTON_SIZES;

  const buttonBase = cn(
    "inline-flex items-center justify-center gap-1.5 text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform,filter] duration-200",
    "ease-out",
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
    "cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-50",
    "hover:brightness-110 active:scale-[0.98]",
  );

  const buttonVariants: Record<string, string> = {
    primary: cn(
      "bg-primary font-semibold text-black shadow-sm",
      "focus-visible:ring-primary active:bg-primary/90 disabled:hover:brightness-100",
    ),
    secondary: cn(
      "border border-white/10 bg-surface-2 text-foreground shadow-sm",
      "hover:border-white/20 hover:bg-surface-3",
      "focus-visible:ring-primary active:bg-surface-2 disabled:hover:bg-surface-2",
    ),
    neutral: cn(
      "border border-neutral-700/50 bg-neutral-800 text-white shadow-sm",
      "hover:border-neutral-500 hover:bg-neutral-700",
      "focus-visible:ring-neutral-500 active:bg-neutral-600",
    ),
    danger: cn(
      "border border-error/20 bg-error/10 text-error",
      "hover:border-error/30 hover:bg-error/20",
      "focus-visible:ring-error active:bg-error/30 disabled:hover:bg-error/10",
    ),
    success: cn(
      "border border-success/20 bg-success/10 text-success",
      "hover:border-success/30 hover:bg-success/20",
      "focus-visible:ring-success active:bg-success/30 disabled:hover:bg-success/10",
    ),
    ghost: cn(
      "bg-transparent text-muted",
      "hover:bg-white/5 hover:text-foreground",
      "focus-visible:ring-primary active:bg-white/10 disabled:hover:bg-transparent",
    ),
    outline: cn(
      "border border-white/10 bg-transparent text-foreground shadow-sm",
      "hover:border-white/20 hover:bg-white/[0.02]",
      "active:bg-white/10 disabled:hover:border-white/10 disabled:hover:bg-transparent",
      "focus-visible:ring-primary",
    ),
  };

  return cn(
    buttonBase,
    sizeStyles[buttonSize as keyof typeof sizeStyles],
    buttonVariants[variant],
    fullWidth && "w-full",
    className,
  );
}

/**
 * Enhanced Button component with multiple variants, loading states, and icon support.
 */
function ButtonBase({
  children,
  text,
  type = "button",
  variant = BUTTON_VARIANTS.PRIMARY,
  buttonSize = "md",
  icon,
  iconPosition = ICON_POSITIONS.RIGHT,
  leftIcon,
  rightIcon,
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

  // Memoize button class computation to avoid recalculation on every render
  const buttonClasses = useMemo(() => {
    return getButtonClasses(variant, buttonSize, fullWidth, className);
  }, [buttonSize, variant, fullWidth, className]);

  // Determine which icons to render (support both old and new API)
  const effectiveLeftIcon =
    leftIcon ?? (icon && iconPosition === ICON_POSITIONS.LEFT ? icon : null);
  const effectiveRightIcon =
    rightIcon ?? (icon && iconPosition === ICON_POSITIONS.RIGHT ? icon : null);

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
    const content = children ?? text;

    return (
      <span className="flex items-center justify-center">
        {effectiveLeftIcon && (
          <span className="mr-2 flex shrink-0 items-center">
            {effectiveLeftIcon}
          </span>
        )}
        {content && <span>{content}</span>}
        {effectiveRightIcon && (
          <span className="ml-2 flex shrink-0 items-center">
            {effectiveRightIcon}
          </span>
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
      aria-label={ariaLabel ?? text}
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
