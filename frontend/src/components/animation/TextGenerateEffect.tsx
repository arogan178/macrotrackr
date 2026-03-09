import { motion, type Transition } from "motion/react";
import React, { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks";

interface TextGenerateEffectProps {
  text: string;
  mode?: "word" | "character";
  speed?: number;
  duration?: number;
  className?: string;
  textClassName?: string;
  onComplete?: () => void;
}

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
