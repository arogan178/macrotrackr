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
} from "@/components/Icons";

type ActionVariant =
  | "delete"
  | "edit"
  | "close"
  | "add"
  | "more"
  | "info"
  | "warning"
  | "custom";

type ActionSize = "sm" | "md" | "lg";

interface ActionButtonProps {
  variant: ActionVariant;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel: string;
  disabled?: boolean;
  size?: ActionSize;
  icon?: React.ReactNode; // Required for custom variant
  className?: string; // Additional styling for custom variants
  tooltip?: string; // Future: tooltip support
}

const ACTION_CONFIGS = {
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
  custom: {
    icon: null,
    className: "", // Provided via props
  },
} as const;

const SIZE_CONFIGS = {
  sm: {
    padding: "p-1.5",
    iconSize: "w-3.5 h-3.5",
    square: "w-8 h-8 aspect-square", // 32px
  },
  md: {
    padding: "p-2",
    iconSize: "w-4 h-4",
    square: "w-9 h-9 aspect-square", // 36px
  },
  lg: {
    padding: "p-2.5",
    iconSize: "w-5 h-5",
    square: "w-10 h-10 aspect-square", // 40px
  },
} as const;

function ActionButton({
  variant,
  onClick,
  ariaLabel,
  disabled = false,
  size = "md",
  icon: customIcon,
  className: customClassName = "",
  ...rest
}: ActionButtonProps) {
  const config = ACTION_CONFIGS[variant];
  const sizeConfig = SIZE_CONFIGS[size];

  // For custom variant, require custom icon and className
  if (variant === "custom" && !customIcon) {
    console.warn("ActionButton: custom variant requires an icon prop");
  }

  // Determine icon to use
  const IconComponent = variant === "custom" ? null : config.icon;
  const iconElement =
    variant === "custom" ? (
      customIcon
    ) : IconComponent ? (
      <IconComponent className={sizeConfig.iconSize} />
    ) : null;

  // Build className
  const baseClasses = `${sizeConfig.padding} ${sizeConfig.square} flex items-center justify-center transition-colors duration-200`;
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
