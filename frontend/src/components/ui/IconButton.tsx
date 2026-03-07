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

import { ICON_BUTTON_SIZES, ICON_SIZES } from "@/components/utils";

import { cn } from "../../lib/classnameUtilities";
import Button from "./Button";
import {
  CloseIcon,
  EditIcon,
  ExportIcon,
  InfoIcon,
  MoreVerticalIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from "./Icons";
import type { ButtonSize, IconSize } from "./Types";

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
        "text-foreground bg-surface-2/40 hover:bg-surface-2/80 focus-visible:ring-gray-500 backdrop-blur-sm transition-colors duration-200",
    },
    delete: {
      icon: TrashIcon,
      className:
        "text-error bg-error/10 border border-transparent hover:bg-error/20 hover:border-error/30 focus-visible:ring-red-500 transition-colors duration-200",
    },
    edit: {
      icon: EditIcon,
      className:
        "text-foreground bg-surface-2/30 border border-transparent hover:bg-surface-2/80 hover:border-white/10 focus-visible:ring-gray-500 backdrop-blur-sm transition-colors duration-200",
    },
    close: {
      icon: CloseIcon,
      className:
        "text-foreground bg-surface-2/30 border border-transparent hover:bg-surface-2/80 hover:border-white/10 focus-visible:ring-gray-500 !rounded-full backdrop-blur-sm transition-colors duration-200",
    },
    add: {
      icon: PlusIcon,
      className:
        "text-primary bg-primary/10 border border-transparent hover:bg-primary/20 hover:border-primary/30 focus-visible:ring-primary backdrop-blur-sm transition-colors duration-200",
    },
    more: {
      icon: MoreVerticalIcon,
      className:
        "text-foreground bg-surface-3/40 border border-transparent hover:bg-surface-3/70 hover:border-white/10 focus-visible:ring-gray-500 backdrop-blur-sm transition-colors duration-200",
    },
    info: {
      icon: InfoIcon,
      className:
        "text-blue-400 bg-blue-400/10 border border-transparent hover:bg-blue-400/20 hover:border-blue-400/30 focus-visible:ring-blue-500 backdrop-blur-sm transition-colors duration-200",
    },
    warning: {
      icon: WarningIcon,
      className:
        "text-warning bg-warning/10 border border-transparent hover:bg-warning/20 hover:border-warning/30 focus-visible:ring-yellow-500 transition-colors duration-200",
    },
    export: {
      icon: ExportIcon,
      className:
        "text-foreground bg-success/10 border border-transparent hover:text-success hover:bg-success/20 hover:border-success/30 focus-visible:ring-emerald-500 backdrop-blur-sm transition-colors duration-200",
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
  const combinedClassName = cn(
    paddingClass,
    "flex items-center justify-center",
    variant === "custom" ? className : config.className,
    variant !== "custom" && className // apply any extra classes passed to built-in variants as well
  );

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
