import { motion } from "motion/react";
import { memo } from "react";

import { BUTTON_SIZES } from "@/components/utils/Constants";

import Button from "./Button";

// Local TabButton prop definition to avoid missing '@/components/utils/Types'
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
 *
 * @example
 * // Basic usage
 * <TabButton active={isActive} onClick={handleClick}>Tab Name</TabButton>
 *
 * @example
 * // With layout animation
 * <TabButton active={isActive} onClick={handleClick} layoutId="tab-indicator">
 *   Tab Name
 * </TabButton>
 *
 * @example
 * // Full width tabs
 * <TabButton active={isActive} onClick={handleClick} fullWidth>
 *   Tab Name
 * </TabButton>
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
  const motionBg = activeBg ?? "bg-primary";
  const sizeClasses = BUTTON_SIZES[size as ButtonSizeKey];

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof globalThis !== "undefined" &&
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      className={`relative ${fullWidth ? "flex-1" : ""}`}
      whileHover={!disabled && !prefersReducedMotion ? { scale: 1.02 } : {}}
      whileTap={!disabled && !prefersReducedMotion ? { scale: 0.98 } : {}}
    >
      <Button
        onClick={onClick}
        variant={active ? "primary" : "ghost"}
        className={`
          relative ${sizeClasses} ${baseRounded} font-medium
          ${active ? "text-background" : "text-muted hover:text-foreground"}
          ${fullWidth ? "w-full" : ""}
          ${className ?? ""}
        `
          .trim()
          .replaceAll(/\s+/g, " ")}
        ariaLabel={typeof children === "string" ? children : undefined}
        disabled={disabled}
        aria-selected={active}
        role={role ?? "tab"}
        {...rest}
      >
        <span className="relative z-10 flex items-center justify-center gap-1.5">
          {children}
        </span>
        {isMotion && active && layoutId && !prefersReducedMotion && (
          <motion.div
            className={`absolute inset-0 ${motionBg} ${baseRounded}`}
            layoutId={layoutId}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
              mass: 0.8,
            }}
            initial={false}
          />
        )}
      </Button>
    </motion.div>
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
      className={`
        relative inline-flex items-center gap-1 p-1
        bg-surface-2/50 rounded-lg
        ${fullWidth ? "w-full" : ""}
        ${className}
      `
        .trim()
        .replaceAll(/\s+/g, " ")}
      role="tablist"
    >
      {children}
    </div>
  );
}

export default memo(TabButton);
