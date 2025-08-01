import { createPortal } from "react-dom";
import { memo, useEffect, useMemo, useState } from "react";
import { useCriticalLoading } from "@/hooks/useGlobalLoading";
import useDeferredVisibility from "@/hooks/useDeferredVisibility";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

/**
 * Full-screen overlay that blocks interaction during critical first-loads or any mutation.
 * Renders via portal to avoid layout shifts and stacking context issues.
 */
function GlobalLoadingOverlay() {
  const { isLoading } = useCriticalLoading();

  // Debounce show by 200ms; keep on screen for 400ms minimum once visible
  const visible = useDeferredVisibility(isLoading, {
    delayMs: 200,
    minVisibleMs: 400,
  });

  // Ensure we have a portal target; default to document.body
  const target = typeof document !== "undefined" ? document.body : null;

  // Optionally set aria-busy on the main app container if present
  useEffect(() => {
    const main = document?.getElementById("app-root");
    if (!main) return;
    if (visible) {
      main.setAttribute("aria-busy", "true");
    } else {
      main.removeAttribute("aria-busy");
    }
  }, [visible]);

  // Respect reduced motion for spinner if desired (spinner already uses simple spin)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  if (!visible || !target) return null;

  const overlay = (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        pointerEvents: "auto",
      }}
    >
      <div className="rounded-xl bg-surface/90 border border-border/60 shadow-modal px-6 py-5">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );

  return createPortal(overlay, target);
}

export default memo(GlobalLoadingOverlay);
