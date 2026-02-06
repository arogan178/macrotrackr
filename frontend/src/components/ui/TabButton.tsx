import { motion } from "motion/react";

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
};

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
  ...rest
}: ExtendedTabButtonProps) {
  const baseRounded = rounded || "rounded-lg";
  const motionBg = activeBg || "bg-primary";
  const sizeClasses = BUTTON_SIZES[size as ButtonSizeKey];

  return (
    <Button
      onClick={onClick}
      variant={active ? "primary" : "ghost"}
      className={`relative ${sizeClasses} ${baseRounded} font-medium ${
        active ? "text-background" : "text-muted hover:text-foreground"
      } ${className || ""}`}
      ariaLabel={typeof children === "string" ? children : undefined}
      disabled={disabled}
      aria-selected={active}
      role={role || "tab"}
      {...rest}
    >
      <span className="relative z-10">{children}</span>
      {isMotion && active && layoutId && (
        <motion.div
          className={`absolute inset-0 ${motionBg} ${baseRounded}`}
          layoutId={layoutId}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        />
      )}
    </Button>
  );
}

export default TabButton;
