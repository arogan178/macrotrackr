import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import useDeferredVisibility from "@/hooks/useDeferredVisibility";
import { useCriticalLoading } from "@/hooks/useGlobalLoading";

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
  const target = typeof document === "undefined" ? null : document.body;

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
    if (globalThis.window === undefined || !globalThis.matchMedia) return false;
    return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      <div className="rounded-xl border border-border/60 bg-surface/90 px-6 py-5 shadow-modal">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );

  return createPortal(overlay, target);
}

export default memo(GlobalLoadingOverlay);
