/**
 * Reveal – the one way content appears.
 *
 * Replaces the `initial`/`animate`/`transition` triple that 27 files were
 * writing by hand, which is how the app ended up with 23 durations, 9 ease
 * spellings and travel distances from 8px to 50px for the same gesture.
 *
 * Opacity only. Position travel reflows the text underneath it, and this is a
 * product people read numbers off — the content arriving is the event, not the
 * distance it arrived from.
 *
 * `step` is ordinal, not seconds: a stagger is "third in the group", and the
 * interval is the system's to decide. That is what stops `delay: 0.05` and
 * `delay: 0.4` from both being reasonable.
 *
 * @example
 * <Reveal>            // fades in on mount
 * <Reveal step={2}>   // third item in a group; 40ms behind the second
 */
import React from "react";
import { m } from "motion/react";

import { DURATIONS, EASINGS } from "@/components/utils/UiConstants";
import { usePrefersReducedMotion } from "@/hooks";

// One step of a stagger. Four items land in 120ms, which reads as one group
// arriving rather than a queue.
const STEP_INTERVAL = 0.04;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Position in a staggered group. Ordinal, not seconds. */
  step?: number;
}

const Reveal: React.FC<RevealProps> = ({ children, className, step = 0 }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: DURATIONS.base,
              ease: EASINGS.out,
              delay: step * STEP_INTERVAL,
            }
      }
      className={className}
    >
      {children}
    </m.div>
  );
};

export default Reveal;
