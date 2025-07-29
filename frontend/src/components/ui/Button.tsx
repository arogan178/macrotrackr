import React, { memo } from "react";

import { LoadingSpinnerIcon } from "@/components/ui";
import {
  BUTTON_VARIANTS,
  DEFAULT_LOADING_TEXT,
  FORM_BUTTON_SIZES,
  formStyles,
  ICON_POSITIONS,
} from "@/components/utils";
import type { ButtonProps } from "@/components/utils/Types";
import { useFeatureLoading, useGlobalLoading } from "@/hooks";

type ButtonAllProps = ButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

function Button({
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
  autoLoadingFeature,
  autoLoadingGlobal = false,
  ...rest
}: ButtonAllProps) {
  // Auto-detect loading states if requested
  const featureLoading = autoLoadingFeature
    ? useFeatureLoading(autoLoadingFeature)
    : null;
  const globalLoading = autoLoadingGlobal ? useGlobalLoading() : null;

  // Determine final loading state
  const autoDetectedLoading =
    featureLoading?.isMutationLoading ||
    globalLoading?.isMutationLoading ||
    false;

  const finalIsLoading = isLoading || autoDetectedLoading;

  // Use centralized styles from formStyles.button
  const sizeStyles = FORM_BUTTON_SIZES;
  const variantStyles = formStyles.button.variants;
  const widthStyles = fullWidth ? formStyles.button.fullWidth : "";
  const buttonClasses = [
    formStyles.button.base,
    sizeStyles[buttonSize as keyof typeof sizeStyles],
    variantStyles[variant],
    widthStyles,
    className,
  ].join(" ");

  const renderContent = () => {
    if (finalIsLoading) {
      return (
        <span className="flex items-center justify-center">
          <LoadingSpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
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

export default memo(Button);
