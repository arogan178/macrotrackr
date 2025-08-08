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
import type { ButtonSize, IconSize } from "@/components/ui/Types";
import { ICON_BUTTON_SIZES, ICON_SIZES } from "@/components/utils";

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
  buttonVariant?: "primary" | "secondary" | "danger" | "success" | "ghost";
}

// Function to get action configs to avoid temporal dead zone issues
const getActionConfigs = () =>
  ({
    "password-toggle": {
      icon: undefined, // Icon is always passed as prop for this variant
      className:
        "text-foreground hover:text-foreground hover:bg-surface-2 focus:ring-gray-500",
    },
    delete: {
      icon: TrashIcon,
      className:
        "text-error hover:text-error bg-error hover:bg-error focus:ring-red-500",
    },
    edit: {
      icon: EditIcon,
      className:
        "text-foreground hover:text-foreground  hover:bg-surface-2 focus:ring-gray-500",
    },
    close: {
      icon: CloseIcon,
      className:
        "text-foreground hover:text-foreground  hover:bg-surface-2 focus:ring-gray-500 !rounded-full",
    },
    add: {
      icon: PlusIcon,
      className:
        "text-primary hover:text-primary hover:bg-primary/40 focus:ring-primary",
    },
    more: {
      icon: MoreVerticalIcon,
      className:
        "text-foreground hover:text-foreground hover:bg-surface-3/70 focus:ring-gray-500",
    },
    info: {
      icon: InfoIcon,
      className:
        "text-primary hover:text-primary hover:bg-primary/40 focus:ring-primary",
    },
    warning: {
      icon: WarningIcon,
      className:
        "text-warning hover:text-warning bg-warning/20 hover:bg-warning/35 focus:ring-yellow-500",
    },
    export: {
      icon: ExportIcon,
      className:
        "text-foreground hover:text-success hover:bg-surface-2 focus:ring-emerald-500",
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
  buttonVariant = "ghost",
  ...rest
}: IconButtonProps) {
  const config = getActionConfigs()[variant];
  // Prefer iconSize, fallback to buttonSize (both are strongly typed)
  const resolvedIconSize: IconSize = iconSize || buttonSize;
  const iconSizeKey = resolvedIconSize as keyof typeof ICON_SIZES;
  const buttonSizeKey = buttonSize as keyof typeof ICON_BUTTON_SIZES;
  const iconSizeClass = ICON_SIZES[iconSizeKey] || ICON_SIZES.md;
  const paddingClass = ICON_BUTTON_SIZES[buttonSizeKey] || ICON_BUTTON_SIZES.md;

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
      variant={buttonVariant}
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
