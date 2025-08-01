import { memo, useMemo } from "react";
import useDeferredVisibility from "@/hooks/useDeferredVisibility";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

/**
 * A thin, fixed top loading bar that overlays the app without affecting layout.
 * Visible for any fetching (queries or mutations). Uses debounce and minimum visibility to reduce flicker.
 */
function TopLoadingBar() {
  const { isLoading } = useGlobalLoading();

  // Debounce show by 200ms; keep on screen for 400ms minimum once visible
  const visible = useDeferredVisibility(isLoading, {
    delayMs: 200,
    minVisibleMs: 400,
  });

  // Respect reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
    >
      <div className="h-[3px] bg-transparent">
        <div
          className={`h-full bg-primary ${
            prefersReducedMotion
              ? ""
              : "animate-[loadingbar_1.2s_ease-in-out_infinite]"
          }`}
          style={{
            width: prefersReducedMotion ? "100%" : "30%",
            // Provide a subtle gradient if desired; fallback to solid color via bg-primary
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.1))",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      {/* Keyframes via inline style to avoid editing Tailwind config */}
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
