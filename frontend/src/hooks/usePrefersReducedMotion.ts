import { useReducedMotion } from "motion/react";

/**
 * Hook to detect user's motion preference
 * @returns boolean indicating if reduced motion is preferred
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
