/**
 * ProgressiveBlur – Applies increasing blur gradient for fading content edges.
 *
 * Creates a blur-to-transparent overlay that fades out content at container edges.
 * Uses backdrop-filter for actual blur effect with mask-image for progressive fading.
 * Required for all scrollable containers per Memoria Design System.
 *
 * @example
 * // Basic usage at bottom of scroll container
 * <div className="relative flex-1 min-h-0">
 *   <div className="absolute inset-0 overflow-y-auto pb-16">
 *     <ContentList />
 *   </div>
 *   <ProgressiveBlur direction="up" />
 * </div>
 *
 * @example
 * // With custom intensity and height
 * <div className="relative">
 *   <ScrollableContent />
 *   <ProgressiveBlur
 *     direction="up"
 *     intensity={0.8}
 *     height="80px"
 *   />
 * </div>
 *
 * @example
 * // Top blur for reverse scrolling
 * <div className="relative">
 *   <ContentList />
 *   <ProgressiveBlur direction="down" position="top" />
 * </div>
 */
import { AnimatePresence, motion } from "motion/react";
import React from "react";

interface ProgressiveBlurProps {
  /**
   * Direction of the blur gradient.
   * - "up": Blur increases upward (fades bottom edge)
   * - "down": Blur increases downward (fades top edge)
   * @default "up"
   */
  direction?: "up" | "down";
  /**
   * Intensity of the blur effect (0-1).
   * Higher values create stronger blur.
   * @default 0.6
   */
  intensity?: number;
  /**
   * Height of the blur gradient area.
   * Should be 60-80px per design system guidelines.
   * @default "60px"
   */
  height?: string;
  /**
   * Position of the blur overlay.
   * @default "bottom"
   */
  position?: "top" | "bottom";
  /**
   * Whether to show the blur effect.
   * When false, renders nothing (useful for scroll-based visibility).
   * @default true
   */
  show?: boolean;
  /**
   * Additional CSS classes.
   * Common: "pointer-events-none absolute left-0 w-full"
   */
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
