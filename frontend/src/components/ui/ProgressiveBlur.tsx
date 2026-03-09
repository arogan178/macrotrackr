import { AnimatePresence, motion } from "motion/react";
import React from "react";

interface ProgressiveBlurProps {
  direction?: "up" | "down";
  intensity?: number;
  height?: string;
  position?: "top" | "bottom";
  show?: boolean;
  className?: string;
}

const ProgressiveBlur: React.FC<ProgressiveBlurProps> = ({
  direction = "up",
  intensity = 0.6,
  height = "60px",
  position = "bottom",
  show = true,
  className = "",
}) => {
  // Clamp intensity between 0 and 1
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  // Calculate blur amount based on intensity (max 10px blur for stronger effect)
  const blurAmount = clampedIntensity * 10;

  // Build mask gradient direction - this fades the blur itself
  const maskDirection = direction === "up" ? "to top" : "to bottom";

  // Position classes
  const positionClasses =
    position === "bottom" ? "bottom-0 left-0" : "top-0 left-0";

  // Use backdrop-filter for actual blur effect
  // Use mask-image to progressively fade the blur (not a color overlay)
  // z-index: 5 keeps blur below scrollbar (scrollbar typically z-10 or auto)
  const blurStyle: React.CSSProperties = {
    height,
    backdropFilter: `blur(${blurAmount}px)`,
    WebkitBackdropFilter: `blur(${blurAmount}px)`,
    // Mask fades the blur effect itself from solid to transparent
    maskImage: `linear-gradient(${maskDirection}, black 0%, transparent 100%)`,
    WebkitMaskImage: `linear-gradient(${maskDirection}, black 0%, transparent 100%)`,
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`pointer-events-none absolute z-5 w-full ${positionClasses} ${className}`}
          style={blurStyle}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
};

export default ProgressiveBlur;
