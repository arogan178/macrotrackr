/**
 * TextGenerateEffect – Animates text with a staggered reveal effect.
 *
 * Creates a blur-to-clear reveal animation for text, either character by character
 * or word by word. Uses Framer Motion for smooth animations.
 * Respects `prefers-reduced-motion` for accessibility.
 *
 * @example
 * // Word-by-word reveal (default)
 * <TextGenerateEffect text="Welcome to Macro Tracker" />
 *
 * @example
 * // Character-by-character reveal with custom speed
 * <TextGenerateEffect
 *   text="Loading..."
 *   mode="character"
 *   speed={0.05}
 * />
 *
 * @example
 * // Dramatic reveal for hero text
 * <TextGenerateEffect
 *   text="Track your nutrition journey"
 *   mode="word"
 *   speed={0.2}
 *   className="text-4xl font-light text-white"
 * />
 */
import { motion, type Transition } from "motion/react";
import React, { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks";

interface TextGenerateEffectProps {
  /**
   * The text to animate.
   */
  text: string;
  /**
   * Animation mode.
   * - "word": Reveal word by word (default, better for headings)
   * - "character": Reveal character by character (better for short text)
   * @default "word"
   */
  mode?: "word" | "character";
  /**
   * Stagger delay between each unit (word or character) in seconds.
   * - Fast: 0.08 (default)
   * - Dramatic: 0.2
   * @default 0.08
   */
  speed?: number;
  /**
   * Duration of each unit's reveal animation in seconds.
   * @default 0.4
   */
  duration?: number;
  /**
   * Additional CSS classes for the container.
   */
  className?: string;
  /**
   * Additional CSS classes for each text unit.
   */
  textClassName?: string;
  /**
   * Callback when animation completes.
   */
  onComplete?: () => void;
}

/**
 * Animation variants for blur-to-clear reveal
 */
const unitVariants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
    y: 5,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
  },
};

/**
 * Reduced motion variants (simple fade only)
 */
const reducedMotionVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
};

const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
  text,
  mode = "word",
  speed = 0.08,
  duration = 0.4,
  className = "",
  textClassName = "",
  onComplete,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Split text into units based on mode
  const units = mode === "word" ? text.split(" ") : [...text];

  // Choose variants based on motion preference
  const variants = prefersReducedMotion ? reducedMotionVariants : unitVariants;

  // Transition configuration using design system easing
  // Use "easeOut" as fallback for reduced motion, otherwise use cubic-bezier
  const transition: Transition = prefersReducedMotion
    ? { duration: 0.15 }
    : {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], // Page transition easing from design system
      };

  // Calculate total animation time for onComplete callback
  useEffect(() => {
    if (onComplete) {
      const totalTime = (units.length - 1) * speed + duration;
      const timer = setTimeout(onComplete, totalTime * 1000);
      return () => clearTimeout(timer);
    }
  }, [onComplete, units.length, speed, duration]);

  return (
    <motion.div
      className={`flex flex-wrap ${mode === "word" ? "gap-x-1.5" : ""} ${className}`}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {units.map((unit, index) => (
        <motion.span
          key={`${mode}-${index}`}
          variants={variants}
          transition={{
            ...transition,
            delay: index * speed,
          }}
          className={`inline-block ${textClassName}`}
          style={{ whiteSpace: mode === "word" ? "nowrap" : "pre" }}
        >
          {unit}
          {mode === "word" && index < units.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default TextGenerateEffect;
