/* eslint-disable react/prop-types */
import { memo, useMemo } from "react";
import { motion } from "motion/react";

import { cn } from "../../lib/classnameUtilities";

import { CheckCircleIcon, InfoIcon, WarningIcon } from "./Icons";

type BadgeSize = "sm" | "md" | "lg";

type BadgeVariant = "solid" | "outline" | "subtle" | "glass";

type StatusType =
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info";

export interface StatusBadgeProps {
  status: StatusType | string;
  size?: BadgeSize;
  variant?: BadgeVariant;
  pulse?: boolean;
  icon?: React.ReactNode;
  text?: string;
  className?: string;
  showIcon?: boolean;
}

const SIZE_CONFIG: Record<
  BadgeSize,
  { container: string; text: string; icon: string }
> = {
  sm: {
    container: "px-2 py-0.5",
    text: "text-xs",
    icon: "h-3 w-3 mr-1",
  },
  md: {
    container: "px-3 py-1.5",
    text: "text-xs",
    icon: "h-3 w-3 mr-1.5",
  },
  lg: {
    container: "px-4 py-2",
    text: "text-sm",
    icon: "h-4 w-4 mr-2",
  },
};

const STATUS_CONFIG: Record<
  StatusType,
  { text: string; colorClass: string; icon: React.ReactNode }
> = {
  active: {
    text: "Active",
    colorClass: "success",
    icon: <CheckCircleIcon />,
  },
  success: {
    text: "Success",
    colorClass: "success",
    icon: <CheckCircleIcon />,
  },
  past_due: {
    text: "Past Due",
    colorClass: "warning",
    icon: <WarningIcon />,
  },
  warning: {
    text: "Warning",
    colorClass: "warning",
    icon: <WarningIcon />,
  },
  unpaid: {
    text: "Unpaid",
    colorClass: "error",
    icon: <WarningIcon />,
  },
  error: {
    text: "Error",
    colorClass: "error",
    icon: <WarningIcon />,
  },
  canceled: {
    text: "Canceled",
    colorClass: "neutral",
    icon: <InfoIcon />,
  },
  neutral: {
    text: "Neutral",
    colorClass: "neutral",
    icon: <InfoIcon />,
  },
  info: {
    text: "Info",
    colorClass: "info",
    icon: <InfoIcon />,
  },
};

const getVariantClasses = (
  colorClass: string,
  variant: BadgeVariant,
): string => {
  const colorMap: Record<string, { bg: string; text: string; border: string; glass: string }> =
    {
      success: {
        bg: "bg-success/20",
        text: "text-success",
        border: "border-success/40",
        glass: "bg-success/10 border-success/20",
      },
      warning: {
        bg: "bg-warning/20",
        text: "text-warning",
        border: "border-warning/40",
        glass: "bg-warning/10 border-warning/20",
      },
      error: {
        bg: "bg-error/20",
        text: "text-error",
        border: "border-error/40",
        glass: "bg-error/10 border-error/20",
      },
      neutral: {
        bg: "bg-surface-3",
        text: "text-foreground",
        border: "border-border/40",
        glass: "bg-surface-2/40 border-white/5",
      },
      info: {
        bg: "bg-blue/20",
        text: "text-blue",
        border: "border-blue/40",
        glass: "bg-blue/10 border-blue/20",
      },
    };

  const colors = colorMap[colorClass] ?? colorMap.neutral;

  switch (variant) {
    case "solid": {
      return cn(colors.bg, colors.text, "border", colors.border);
    }
    case "outline": {
      return cn("bg-transparent", colors.text, "border", colors.border);
    }
    case "subtle": {
      return cn(`${colors.bg}/50`, colors.text, "border border-transparent");
    }
    case "glass": {
      return cn(colors.glass, colors.text, "border backdrop-blur-md");
    }
    default: {
      return cn(colors.bg, colors.text, "border", colors.border);
    }
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = memo(function StatusBadge({
  status,
  size = "md",
  variant = "solid",
  pulse = false,
  icon,
  text,
  className = "",
  showIcon = true,
}) {
  const statusConfig = useMemo(() => {
    const knownStatus = status as StatusType;
    if (knownStatus in STATUS_CONFIG) {
      return STATUS_CONFIG[knownStatus];
    }

    return {
      text:
        status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " "),
      colorClass: "neutral",
      icon: <InfoIcon />,
    };
  }, [status]);

  const sizeClasses = SIZE_CONFIG[size];

  const variantClasses = useMemo(
    () => getVariantClasses(statusConfig.colorClass, variant),
    [statusConfig.colorClass, variant],
  );

  const shouldPulse =
    pulse &&
    (status === "active" || status === "error" || status === "warning");

  const prefersReducedMotion =
    typeof globalThis !== "undefined" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        sizeClasses.container,
        sizeClasses.text,
        variantClasses,
        className
      )}
      role="status"
      aria-label={text ?? statusConfig.text}
    >
      {showIcon && (
        <span className={cn("relative", sizeClasses.icon)}>
          {icon ?? statusConfig.icon}
          {shouldPulse && !prefersReducedMotion && (
            <motion.span
              className={cn(
                "absolute inset-0 rounded-full",
                statusConfig.colorClass === "success"
                  ? "bg-success"
                  : statusConfig.colorClass === "error"
                    ? "bg-error"
                    : "bg-warning"
              )}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          )}
        </span>
      )}
      <span className="tracking-wide uppercase">
        {text ?? statusConfig.text}
      </span>
    </div>
  );
});

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
