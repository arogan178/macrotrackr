import { FormButtonProps } from "../utils/types";
import LoadingSpinner from "../LoadingSpinner";

export function FormButton({
  isLoading = false,
  loadingText = "Processing...",
  text,
  onClick,
  type = "button",
  variant = "primary",
  icon,
  className = "",
  disabled = false,
}: FormButtonProps) {
  // Base button styles for all variants
  const baseStyles =
    "flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg";

  // Variant-specific styles
  const variantStyles = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
    secondary:
      "bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    ghost: "bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white",
  };

  // Final button classes
  const buttonClasses = `${baseStyles} ${
    variantStyles[variant as keyof typeof variantStyles]
  } ${className}`;

  // Determine icon position based on variant
  const isPrimary = variant === "primary";
  const iconClass = text ? (isPrimary ? "ml-2" : "mr-2") : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={buttonClasses}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner />
          <span>{loadingText}</span>
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {icon && !isPrimary && <span className={iconClass}>{icon}</span>}
          <span>{text}</span>
          {icon && isPrimary && <span className={iconClass}>{icon}</span>}
        </span>
      )}
    </button>
  );
}
