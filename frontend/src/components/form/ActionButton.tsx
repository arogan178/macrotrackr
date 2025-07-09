/**
 * ActionButton – Standardized circular icon buttons for common actions.
 *
 * Provides predefined styling for common action types (delete, edit, close, etc.)
 * while maintaining consistency with the FormButton system.
 *
 * @example
 * // Delete button
 * <ActionButton variant="delete" onClick={handleDelete} ariaLabel="Delete item" />
 *
 * @example
 * // Edit button
 * <ActionButton variant="edit" onClick={handleEdit} ariaLabel="Edit item" />
 *
 * @example
 * // Custom action with custom icon
 * <ActionButton
 *   variant="custom"
 *   icon={<CustomIcon />}
 *   onClick={handleCustomAction}
 *   ariaLabel="Custom action"
 *   className="text-purple-400 hover:text-purple-300 bg-purple-900/30 hover:bg-purple-900/50"
 * />
 */
import React, { memo } from "react";
import FormButton from "./FormButton";
import {
  TrashIcon,
  EditIcon,
  CloseIcon,
  PlusIcon,
  MoreVerticalIcon,
  InfoIcon,
  WarningIcon,
  ExportIcon,
} from "@/components/Icons";

import { ICON_SIZES } from "@/components/utils/constants";

type ActionVariant =
  | "delete"
  | "edit"
  | "close"
  | "add"
  | "more"
  | "info"
  | "warning"
  | "export"
  | "password-toggle"
  | "custom";

type ButtonSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
type IconSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

interface ActionButtonProps {
  variant: ActionVariant;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel: string;
  disabled?: boolean;
  buttonSize?: ButtonSize;
  iconSize?: IconSize;
  icon?: React.ReactNode; // Required for custom variant
  className?: string; // Additional styling for custom variants
  tooltip?: string; // Future: tooltip support
}

const PADDING = {
  sm: "p-1.5 w-8 h-8 aspect-square", // 32px
  md: "p-2 w-9 h-9 aspect-square", // 36px
  lg: "p-2.5 w-10 h-10 aspect-square", // 40px
  xl: "p-3 w-11 h-11 aspect-square", // 44px
  "2xl": "p-4 w-12 h-12 aspect-square", // 48px
  "3xl": "p-5 w-14 h-14 aspect-square", // 56px
  "4xl": "p-6 w-16 h-16 aspect-square", // 64px
  "5xl": "p-7 w-18 h-18 aspect-square", // 72px
};

const ACTION_CONFIGS = {
  "password-toggle": {
    icon: null, // Icon is always passed as prop for this variant
    className:
      "text-gray-400 hover:text-gray-300 bg-transparent focus:ring-gray-500",
  },
  delete: {
    icon: TrashIcon,
    className:
      "text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 focus:ring-red-500",
  },
  edit: {
    icon: EditIcon,
    className:
      "text-gray-400 hover:text-gray-100 bg-gray-700/50 hover:bg-gray-700 focus:ring-gray-500",
  },
  close: {
    icon: CloseIcon,
    className:
      "text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700/70 focus:ring-gray-500 !rounded-full",
  },
  add: {
    icon: PlusIcon,
    className:
      "text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 focus:ring-indigo-500",
  },
  more: {
    icon: MoreVerticalIcon,
    className:
      "text-gray-400 hover:text-gray-100 bg-gray-700/50 hover:bg-gray-700 focus:ring-gray-500",
  },
  info: {
    icon: InfoIcon,
    className:
      "text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 focus:ring-blue-500",
  },
  warning: {
    icon: WarningIcon,
    className:
      "text-yellow-400 hover:text-yellow-300 bg-yellow-900/30 hover:bg-yellow-900/50 focus:ring-yellow-500",
  },
  export: {
    icon: ExportIcon,
    className:
      "text-emerald-400 hover:text-emerald-200 bg-emerald-900/30 hover:bg-emerald-900/50 focus:ring-emerald-500",
  },
  custom: {
    icon: null,
    className: "", // Provided via props
  },
} as const;

function ActionButton({
  variant,
  onClick,
  ariaLabel,
  disabled = false,
  buttonSize = "md",
  iconSize,
  icon: customIcon,
  className: customClassName = "",
  ...rest
}: ActionButtonProps) {
  const config = ACTION_CONFIGS[variant];
  const resolvedIconSize = iconSize || buttonSize;
  const iconSizeClass = ICON_SIZES[resolvedIconSize] || ICON_SIZES.md;
  const paddingClass = PADDING[buttonSize] || PADDING.md;

  // For custom variant, require custom icon and className
  if (variant === "custom" && !customIcon) {
    console.warn("ActionButton: custom variant requires an icon prop");
  }

  // Determine icon to use
  const usePropIcon = variant === "custom" || variant === "password-toggle";
  const IconComponent = usePropIcon ? null : config.icon;
  // Forward both size and iconSize class to Lucide-based icons (from createIcon)
  const iconElement = usePropIcon ? (
    customIcon
  ) : IconComponent ? (
    <IconComponent size={resolvedIconSize} className={iconSizeClass} />
  ) : null;

  // Build className
  const baseClasses = `${paddingClass} flex items-center justify-center transition-colors duration-200`;
  const variantClasses =
    variant === "custom" ? customClassName : config.className;
  const combinedClassName = `${baseClasses} ${variantClasses}`.trim();

  return (
    <FormButton
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      ariaLabel={ariaLabel}
      {...rest}
    >
      {iconElement}
    </FormButton>
  );
}

export default memo(ActionButton);
