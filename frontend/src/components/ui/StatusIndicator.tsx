import React from "react";

import { cn } from "../../lib/classnameUtilities";
import { CheckMarkIcon, CloseIcon, InfoIcon, WarningIcon } from "./Icons";

export type StatusType = "success" | "error" | "warning" | "info";

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
      className={cn("flex items-center gap-2 text-sm font-medium", color, className)}
      role="status"
      aria-live={ariaLive}
    >
      {icon || <Icon className="h-4 w-4" />} {message}
    </div>
  );
};

export default React.memo(StatusIndicator);
