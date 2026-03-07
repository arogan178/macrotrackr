import { motion } from "motion/react";
import { memo } from "react";

import { BUTTON_SIZES } from "@/components/utils/Constants";
import { cn } from "@/lib/classnameUtilities";

export type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  layoutId?: string;
  isMotion?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  role?: string;
  "aria-selected"?: boolean;
};

type ButtonSizeKey = keyof typeof BUTTON_SIZES;

type ExtendedTabButtonProps = TabButtonProps & {
  rounded?: string;
  activeBg?: string;
  size?: ButtonSizeKey;
  /** Make tab button fill available width */
  fullWidth?: boolean;
};

/**
 * TabButton with smooth background transition for active state.
 * Uses background color change to indicate active tab.
 */
function TabButton({
  active,
  onClick,
  children,
  layoutId,
  isMotion = true,
  rounded,
  activeBg,
  disabled,
  size = "md",
  className,
  role,
  fullWidth = false,
  ...rest
}: ExtendedTabButtonProps) {
  const baseRounded = rounded ?? "rounded-lg";
  const motionBg = activeBg ?? "bg-surface-3"; // Darker, premium active state
  const sizeClasses = BUTTON_SIZES[size as ButtonSizeKey] || BUTTON_SIZES.md;

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof globalThis !== "undefined" &&
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      role={role ?? "tab"}
      aria-selected={active}
      aria-label={typeof children === "string" ? children : undefined}
      className={cn(
        "relative inline-flex items-center justify-center font-medium transition-colors duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses,
        baseRounded,
        fullWidth ? "w-full flex-1" : "",
        active ? "text-foreground" : "text-muted hover:bg-surface-2/50 hover:text-foreground",
        "disabled:hover:bg-transparent disabled:hover:text-muted",
        className
      )}
      {...rest}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {children}
      </span>
      {active && (
        <motion.div
          layoutId={layoutId}
          className={cn("absolute inset-0 z-0 border border-border/50 shadow-sm", baseRounded, motionBg)}
          initial={isMotion && !prefersReducedMotion ? false : { opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
        />
      )}
    </button>
  );
}

/**
 * TabButtonGroup - Container for managing multiple TabButtons
 */
export interface TabButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Full width tabs */
  fullWidth?: boolean;
}

export function TabButtonGroup({
  children,
  className = "",
  fullWidth = false,
}: TabButtonGroupProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1 p-1",
        "rounded-xl border border-white/5 bg-surface-2/80 backdrop-blur-md",
        fullWidth ? "w-full" : "",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export default memo(TabButton);
