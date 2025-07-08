import { motion } from "motion/react";
import FormButton from "./FormButton";
import { TabButtonProps } from "@/components/utils/types";

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
  const motionBg = activeBg || "bg-indigo-600";

  // Use FormButton for standardization
  return (
    <FormButton
      onClick={onClick}
      variant={active ? "primary" : "ghost"}
      size="sm"
      className={`relative px-3 py-1.5 ${baseRounded} text-sm font-medium ${
        active
          ? "text-white"
          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
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
          className={`absolute inset-0 ${motionBg} ${baseRounded} shadow-md`}
          layoutId={layoutId}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
    </FormButton>
  );
}

export default TabButton;
