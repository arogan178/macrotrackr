/**
 * IconButton – Standardized circular icon buttons for common actions.
 *
 * Provides predefined styling for common action types (delete, edit, close, etc.)
 * while maintaining consistency with the Button system.
 *
 * @example
 * // Delete button
 * <IconButton variant="delete" onClick={handleDelete} ariaLabel="Delete item" />
 *
 * @example
 * // Edit button
 * <IconButton variant="edit" onClick={handleEdit} ariaLabel="Edit item" />
 *
 * @example
 * // Custom action with custom icon
 * <IconButton
 *   variant="custom"
 *   icon={<CustomIcon />}
 *   onClick={handleCustomAction}
 *   ariaLabel="Custom action"
 *   className="text-purple-400 hover:text-purple-300 bg-purple-900/30 hover:bg-purple-900/50"
 * />
 */
import React, { memo } from "react";

import {
  Button,
  CloseIcon,
  EditIcon,
  ExportIcon,
  InfoIcon,
  MoreVerticalIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from "@/components/ui";
import type { ButtonSize, IconSize } from "@/components/utils";
import { BUTTON_SIZES, ICON_SIZES } from "@/components/utils";

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

interface IconButtonProps {
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

// Function to get action configs to avoid temporal dead zone issues
const getActionConfigs = () =>
  ({
    "password-toggle": {
      icon: undefined, // Icon is always passed as prop for this variant
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
      icon: undefined,
      className: "", // Provided via props
    },
  }) as const;

function IconButton({
  variant,
  onClick,
  ariaLabel,
  disabled = false,
  buttonSize = "md",
  iconSize,
  icon: customIcon,
  className = "",
  ...rest
}: IconButtonProps) {
  const config = getActionConfigs()[variant];
  // Prefer iconSize, fallback to buttonSize (both are strongly typed)
  const resolvedIconSize: IconSize = iconSize || buttonSize;
  const iconSizeClass = ICON_SIZES[resolvedIconSize] || ICON_SIZES.md;
  const paddingClass = BUTTON_SIZES[buttonSize] || BUTTON_SIZES.md;

  // Icon logic: use custom icon for 'custom' and 'password-toggle', otherwise use config.icon
  let iconElement: React.ReactNode;
  if (variant === "custom" || variant === "password-toggle") {
    iconElement = customIcon;
  } else if (config.icon) {
    const IconComponent = config.icon;
    iconElement = (
      <IconComponent size={resolvedIconSize} className={iconSizeClass} />
    );
  }

  // Compose className
  const combinedClassName = [
    paddingClass,
    "flex items-center justify-center transition-colors duration-200",
    variant === "custom" ? className : config.className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      variant="ghost"
      buttonSize="sm"
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      ariaLabel={ariaLabel}
      {...rest}
    >
      {iconElement}
    </Button>
  );
}

export default memo(IconButton);
