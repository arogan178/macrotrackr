import { motion } from "motion/react";

import type { TabButtonProps } from "@/components/utils/Types";

import Button from "./Button";

type ExtendedTabButtonProps = TabButtonProps & {
  rounded?: string;
  activeBg?: string;
};

function TabButton({
  active,
  onClick,
  children,
  layoutId,
  isMotion,
  rounded,
  activeBg,
  disabled,
  ...rest
}: ExtendedTabButtonProps) {
  const baseRounded = rounded || "rounded-md";
  const motionBg = activeBg || "bg-primary";

  return (
    <Button
      onClick={onClick}
      variant={active ? "primary" : "ghost"}
      className={`relative px-3 py-1.5 ${baseRounded} text-sm font-medium ${
        active
          ? "text-foreground"
          : "text-foreground hover:bg-surface/50 hover:text-foreground"
      }`}
      ariaLabel={typeof children === "string" ? children : undefined}
      disabled={disabled}
      aria-selected={active}
      role="tab"
      {...rest}
    >
      <span className="relative z-10">{children}</span>
      {isMotion && active && layoutId && (
        <motion.div
          className={`absolute inset-0 ${motionBg} ${baseRounded} shadow-surface`}
          layoutId={layoutId}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
    </Button>
  );
}

export default TabButton;
