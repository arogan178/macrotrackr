import { useEffect, useState } from "react";

/**
 * Hook to detect user's motion preference
 * @returns boolean indicating if reduced motion is preferred
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const windowObject =
      typeof globalThis !== "undefined" && "window" in globalThis
        ? globalThis.window
        : undefined;
    if (!windowObject || typeof windowObject.matchMedia !== "function") {
      return;
    }

    const mediaQuery = windowObject.matchMedia("(prefers-reduced-motion: reduce)");

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
