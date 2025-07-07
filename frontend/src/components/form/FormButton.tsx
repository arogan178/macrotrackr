// This file has been moved to src/features/layout/components/FormButton.tsx
import { memo } from "react";
import { LoadingSpinnerIcon } from "../Icons";
import {
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  ICON_POSITIONS,
  DEFAULT_LOADING_TEXT,
} from "../utils/constants";
import { FormButtonProps } from "../utils/types";

/**
 * FormButton component for consistent button styling across the application
 *
 * Supports both children pattern and text/icon pattern for content
 * Handles loading states and proper accessibility attributes
 */
function FormButton({
  children,
  text,
  type = "button",
  variant = BUTTON_VARIANTS.PRIMARY,
  size = BUTTON_SIZES.MD,
  icon,
  iconPosition = ICON_POSITIONS.RIGHT,
  isLoading = false,
  loadingText = DEFAULT_LOADING_TEXT,
  disabled = false,
  className = "",
  onClick,
  fullWidth = false,
  ariaLabel,
}: FormButtonProps) {
  // Base styles applicable to all buttons
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 " +
    "disabled:opacity-70 disabled:cursor-not-allowed rounded-lg cursor-pointer";

  // Size-specific styles
  const sizeStyles = {
    [BUTTON_SIZES.SM]: "px-2.5 py-1.5 text-xs",
    [BUTTON_SIZES.MD]: "px-4 py-2.5 text-sm",
    [BUTTON_SIZES.LG]: "px-5 py-3 text-base",
  };

  // Variant-specific styles
  const variantStyles = {
    [BUTTON_VARIANTS.PRIMARY]:
      "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-sm",
    [BUTTON_VARIANTS.SECONDARY]:
      "bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600 focus:ring-gray-500",
    [BUTTON_VARIANTS.DANGER]:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm",
    [BUTTON_VARIANTS.SUCCESS]:
      "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm",
    [BUTTON_VARIANTS.GHOST]:
      "bg-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white",
  };

  // Width styles
  const widthStyles = fullWidth ? "w-full" : "";

  // Combined classes using array join for better performance
  const buttonClasses = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    widthStyles,
    className,
  ].join(" ");

  // Determine content based on loading state and children/text
  const renderContent = () => {
    if (isLoading) {
      return (
        <span className="flex items-center justify-center">
          <LoadingSpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
          <span>{loadingText}</span>
        </span>
      );
    }

    // If children are provided, use them directly
    if (children) {
      return children;
    }

    // Otherwise use text and icon
    return (
      <span className="flex items-center justify-center">
        {icon && iconPosition === ICON_POSITIONS.LEFT && (
          <span className="mr-2">{icon}</span>
        )}
        {text && <span>{text}</span>}
        {icon && iconPosition === ICON_POSITIONS.RIGHT && (
          <span className="ml-2">{icon}</span>
        )}
      </span>
    );
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={buttonClasses}
      aria-busy={isLoading}
      aria-label={ariaLabel || text}
      data-variant={variant}
    >
      {renderContent()}
    </button>
  );
}

export default memo(FormButton);
