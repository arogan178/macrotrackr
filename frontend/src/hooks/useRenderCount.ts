import { useEffect, useRef } from "react";

import { logger } from "@/lib/logger";

/**
 * Performance monitoring hook for debugging component re-renders.
 * Logs render count to console in development mode only.
 *
 * @param componentName - The name of the component being monitored
 * @returns The current render count
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRenderCount('MyComponent');
 *   // ... component logic
 * }
 * ```
 */
export function useRenderCount(componentName: string): number {
  const count = useRef(0);

  useEffect(() => {
    count.current++;
    if (import.meta.env.DEV) {
      logger.debug(`${componentName} rendered ${count.current} times`);
    }
  });

  return count.current;
}
