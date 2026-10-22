import { memo, useMemo } from "react";

import { useDeferredVisibility } from "@/hooks";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

import { cn } from "../../lib/classnameUtilities";

function TopLoadingBar() {
  const { isLoading } = useGlobalLoading();

  const visible = useDeferredVisibility(isLoading, {
    delayMs: 200,
    minVisibleMs: 400,
  });

  const prefersReducedMotion = useMemo(() => {
    if (typeof globalThis.matchMedia !== "function") return false;

    return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  if (!visible) return null;

  // Indeterminate: a segment sweeps from off the left edge to off the right,
  // one way, so it crosses the whole width. translateX in percent moves by the
  // segment's own width, which is why the old bar stopped near the middle.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 left-0 z-9999 h-0.5 overflow-hidden"
    >
      <div
        className={cn(
          "h-full bg-primary",
          prefersReducedMotion ? "w-full" : "w-1/3 animate-[loading-sweep_1.1s_ease-in-out_infinite]",
        )}
      />
    </div>
  );
}

export default memo(TopLoadingBar);
