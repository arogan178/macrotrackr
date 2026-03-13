/**
 * ScrollTriggeredDiv – Scroll-triggered animation wrapper with blur effect.
 *
 * Animates children when they enter the viewport using spring physics
 * with a blur-to-clear effect. Respects `prefers-reduced-motion`.
 *
 * @example
 * <ScrollTriggeredDiv delay={0.2}>
 *   <Card>Content that animates on scroll</Card>
 * </ScrollTriggeredDiv>
 */
import React, { useRef } from "react";
import { motion, useInView } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks";

interface ScrollTriggeredDivProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

// Animation variants with blur effect
const scrollVariants = {
  hidden: {
    opacity: 0,
    y: 48,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

// Reduced motion variants for accessibility
const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const ScrollTriggeredDiv: React.FC<ScrollTriggeredDivProps> = ({
  children,
  className = "",
  delay = 0,
}) => {
  const reference = useRef<HTMLDivElement>(null);
  const isInView = useInView(reference, { once: true, margin: "-100px" });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Use reduced motion variants if user prefers reduced motion
  const variants = prefersReducedMotion
    ? reducedMotionVariants
    : scrollVariants;

  // Spring physics from design system
  const transition = prefersReducedMotion
    ? { duration: 0.15 }
    : {
        type: "spring" as const,
        stiffness: 420,
        damping: 32,
        duration: 0.65,
        delay,
      };

  return (
    <motion.div
      ref={reference}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollTriggeredDiv;
