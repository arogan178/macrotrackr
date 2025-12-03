/**
 * StatusIndicator – Accessible, standardized status feedback for success, error, warning, or info states.
 *
 * Displays a colored icon and message for user feedback (form errors, API status, etc).
 *
 * Accessibility:
 * - Uses role="status" and aria-live (polite/assertive) for screen readers.
 * - Icon and color are automatically chosen by status type, but can be overridden.
 *
 * Props:
 * @prop {"success"|"error"|"warning"|"info"} status - The status type (controls icon and color)
 * @prop {React.ReactNode} message - The message to display
 * @prop {React.ReactNode} [icon] - Optional custom icon (overrides default)
 * @prop {string} [className] - Additional classes for the container
 * @prop {"polite"|"assertive"} [aria-live] - ARIA live region politeness (default: polite)
 *
 * @example
 * // Basic usage
 * <StatusIndicator status="error" message="Something went wrong" />
 *
 * @example
 * // Custom icon and assertive ARIA
 * <StatusIndicator status="warning" message="Check your input" icon={<MyIcon />} aria-live="assertive" />
 */
import React from "react";

import { CheckMarkIcon, CloseIcon, InfoIcon, WarningIcon } from "./Icons";

export type StatusType = "success" | "error" | "warning" | "info";

/**
 * Props for StatusIndicator
 * @property status - One of "success", "error", "warning", "info"
 * @property message - The message to display
 * @property icon - Optional custom icon (overrides default)
 * @property className - Additional classes for the container
 * @property aria-live - ARIA live region politeness (default: polite)
 */
interface StatusIndicatorProps {
  status: StatusType;
  message: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  "aria-live"?: "polite" | "assertive";
}

const statusConfig = {
  success: {
    color: "text-success",
    Icon: CheckMarkIcon,
  },
  error: {
    color: "text-vibrant-accent",
    Icon: CloseIcon,
  },
  warning: {
    color: "text-warning",
    Icon: WarningIcon,
  },
  info: {
    color: "text-primary",
    Icon: InfoIcon,
  },
};

/**
 * Usage example:
 * <StatusIndicator status="error" message="Something went wrong" />
 */
const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  icon,
  className = "",
  "aria-live": ariaLive = "polite",
}) => {
  const { color, Icon } = statusConfig[status];
  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium ${color} ${className}`}
      role="status"
      aria-live={ariaLive}
    >
      {icon || <Icon className="h-4 w-4" />} {message}
    </div>
  );
};

export default React.memo(StatusIndicator);
