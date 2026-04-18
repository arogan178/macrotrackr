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

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 left-0 z-9999"
    >
      <div className="h-1 bg-transparent">
        <div
          className={cn(
            "h-full bg-primary",
            !prefersReducedMotion && "animate-[loadingbar_1.2s_ease-in-out_infinite]"
          )}
          style={{
            width: prefersReducedMotion ? "100%" : "30%",
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.1))",
            mixBlendMode: "overlay",
          }}
        />
      </div>
      <style>
        {`@keyframes loadingbar {
            0% { transform: translateX(0%); width: 15%; }
            50% { transform: translateX(120%); width: 35%; }
            100% { transform: translateX(0%); width: 15%; }
        }`}
      </style>
    </div>
  );
}

export default memo(TopLoadingBar);
