/**
 * FormButton – Standardized, accessible button for all forms and actions.
 *
 * Handles loading, icon, variant, and accessibility out of the box.
 *
 * Accessibility:
 * - Uses aria-busy and aria-label for screen readers.
 * - Focus ring and disabled states are styled for clarity.
 *
 * Props:
 * @prop {string} [text] - Button text (optional if using children)
 * @prop {React.ReactNode} [children] - Custom content (overrides text/icon)
 * @prop {"primary"|"secondary"|"danger"|"success"|"ghost"} [variant] - Button style variant
 * @prop {"sm"|"md"|"lg"} [size] - Button size
 * @prop {React.ReactNode} [icon] - Optional icon (left or right)
 * @prop {"left"|"right"} [iconPosition] - Icon position (default: right)
 * @prop {boolean} [isLoading] - Show loading spinner and disable button
 * @prop {string} [loadingText] - Text to show when loading
 * @prop {boolean} [disabled] - Disable the button
 * @prop {boolean} [fullWidth] - Make button take full width
 * @prop {string} [className] - Additional classes
 * @prop {string} [ariaLabel] - Accessibility label
 * @prop {function} [onClick] - Click handler
 *
 * @example
 * // Primary button
 * <FormButton text="Save" type="submit" />
 *
 * @example
 * // Secondary button with icon
 * <FormButton text="Cancel" variant="secondary" icon={<XIcon />} iconPosition="left" />
 *
 * @example
 * // Loading state
 * <FormButton text="Submitting..." isLoading />
 */
import React, { memo } from "react";
import { LoadingSpinnerIcon } from "@/components/Icons";
import {
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  ICON_POSITIONS,
  DEFAULT_LOADING_TEXT,
} from "@/components/utils/constants";
import { FormButtonProps } from "@/components/utils/types";

type FormButtonAllProps = FormButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

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
  ...rest
}: FormButtonAllProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium text-sm gap-1.5 transition-all duration-200 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
    "rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed";

  const sizeStyles = {
    [BUTTON_SIZES.SM]: " px-2 py-1 text-xs",
    [BUTTON_SIZES.MD]: "px-3.5 py-2 text-md",
    [BUTTON_SIZES.LG]: "px-5 py-3 text-base",
  };

  const variantStyles = {
    [BUTTON_VARIANTS.PRIMARY]:
      "bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white focus:ring-indigo-500 shadow-sm",
    [BUTTON_VARIANTS.SECONDARY]:
      "bg-gray-700 hover:bg-gray-600 disabled:hover:bg-gray-700 text-gray-100 border border-gray-600 focus:ring-gray-500",
    [BUTTON_VARIANTS.DANGER]:
      "bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600 text-white focus:ring-red-500 shadow-sm",
    [BUTTON_VARIANTS.SUCCESS]:
      "bg-green-600 hover:bg-green-700 disabled:hover:bg-green-600 text-white focus:ring-green-500 shadow-sm",
    [BUTTON_VARIANTS.GHOST]:
      "bg-transparent hover:bg-gray-700/50 disabled:hover:bg-transparent text-gray-300 hover:text-white disabled:hover:text-gray-300",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  const buttonClasses = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    widthStyles,
    className,
  ].join(" ");

  const renderContent = () => {
    if (isLoading) {
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
      disabled={isLoading || disabled}
      className={buttonClasses}
      aria-busy={isLoading}
      aria-label={ariaLabel || text}
      data-variant={variant}
      {...rest}
    >
      {renderContent()}
    </button>
  );
}

export default memo(FormButton);
