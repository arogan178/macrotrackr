/**
 * PageTransition – Blur-to-clear page transition wrapper for smooth navigation.
 *
 * Wraps page content with a blur-to-clear animation using Framer Motion.
 * Respects `prefers-reduced-motion` for accessibility.
 *
 * @example
 * <AnimatePresence mode="wait">
 *   <PageTransition key={pathname}>
 *     <PageContent />
 *   </PageTransition>
 * </AnimatePresence>
 */
import React from "react";
import { m } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Animation variants for smooth fade transition
const pageVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

// Transition configuration using design system easing
const pageTransition = {
  duration: 0.2,
  ease: [0.32, 0.72, 0, 1], // Matches --ease-modal CSS variable
};

// Reduced motion variants for accessibility
const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const reducedMotionTransition = {
  duration: 0.15,
};

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Use reduced motion variants if user prefers reduced motion
  const variants = prefersReducedMotion ? reducedMotionVariants : pageVariants;
  const transition = prefersReducedMotion
    ? reducedMotionTransition
    : pageTransition;

  return (
    <m.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      {children}
    </m.div>
  );
};

export default PageTransition;
