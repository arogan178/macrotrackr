import React, { memo, useMemo } from "react";

import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  DEFAULT_LOADING_TEXT,
  ICON_POSITIONS,
} from "@/components/utils/Constants";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

import { LoadingSpinnerIcon } from "./Icons";
// Fixed type import path: Types are defined in ./Types.ts, not "@/components/ui/types"
import type { ButtonProps } from "./Types";

type ButtonAllProps = ButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function getButtonClasses(
  variant: string = BUTTON_VARIANTS.PRIMARY,
  buttonSize: string = "md",
  fullWidth: boolean = false,
  className: string = "",
): string {
  const sizeStyles = BUTTON_SIZES;

  const buttonBase =
    "inline-flex items-center justify-center font-medium text-sm gap-1.5 " +
    "transition-all duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed " +
    "active:scale-[0.98]";

  const buttonVariants: Record<string, string> = {
    primary:
      "bg-primary text-black hover:bg-primary/90 active:bg-primary/80 font-bold " +
      "disabled:hover:bg-primary focus-visible:ring-primary",
    secondary:
      "bg-surface-3 text-foreground border border-border hover:bg-surface-4 active:bg-surface-2 " +
      "disabled:hover:bg-surface-3 focus-visible:ring-primary",
    neutral:
      "bg-neutral-800 border border-neutral-700 text-white " +
      "hover:bg-neutral-700 hover:border-neutral-600 " +
      "active:bg-neutral-600 focus-visible:ring-neutral-500",
    danger:
      "bg-error/15 text-error border border-error/25 hover:bg-error/25 active:bg-error/35 " +
      "disabled:hover:bg-error/15 focus-visible:ring-error",
    success:
      "bg-success/15 text-success border border-success/25 hover:bg-success/25 active:bg-success/35 " +
      "disabled:hover:bg-success/15 focus-visible:ring-success",
    ghost:
      "bg-transparent text-muted hover:bg-surface-2 hover:text-foreground active:bg-surface-3 " +
      "disabled:hover:bg-transparent focus-visible:ring-primary",
    outline:
      "bg-transparent text-foreground border border-border hover:bg-surface-3 hover:border-primary/50 " +
      "active:bg-surface-2 disabled:hover:bg-transparent disabled:hover:border-border " +
      "focus-visible:ring-primary focus-visible:border-primary",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return [
    buttonBase,
    sizeStyles[buttonSize as keyof typeof sizeStyles],
    buttonVariants[variant],
    widthStyles,
    className,
  ].join(" ");
}

/**
 * Enhanced Button component with multiple variants, loading states, and icon support.
 *
 * @example
 * // Primary button with left icon
 * <Button variant="primary" leftIcon={<PlusIcon />}>Add Item</Button>
 *
 * @example
 * // Outline button with loading state
 * <Button variant="outline" isLoading>Processing...</Button>
 *
 * @example
 * // Ghost button with right icon
 * <Button variant="ghost" rightIcon={<ArrowRightIcon />}>Continue</Button>
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
    const content = children || text;
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
