import { motion } from "motion/react"; // Import motion
import { TabButtonProps } from "../utils/types";

// Extend TabButtonProps to allow optional rounded and activeBg
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
}: ExtendedTabButtonProps) {
  const baseRounded = rounded || "rounded-md";
  const baseStyles = `relative px-3 py-1.5 ${baseRounded} text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 cursor-pointer`;

  const activeStyles = "text-white"; // Text color for active tab
  const inactiveStyles = "text-gray-300 hover:bg-gray-700/50 hover:text-white";

  const motionBg = activeBg || "bg-indigo-600";

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${active ? activeStyles : inactiveStyles}`}
      aria-selected={active}
      role="tab"
    >
      <span className="relative z-10">{children}</span>
      {isMotion && active && layoutId && (
        <motion.div
          className={`absolute inset-0 ${motionBg} ${baseRounded} shadow-md`}
          layoutId={layoutId}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
    </button>
  );
}

export default TabButton;
