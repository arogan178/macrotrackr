import { memo, useEffect } from "react";
import { createPortal } from "react-dom";

import { useDeferredVisibility } from "@/hooks";
import { useCriticalLoading } from "@/hooks/useGlobalLoading";

import LoadingSpinner from "./LoadingSpinner";

function GlobalLoadingOverlay() {
  const { isLoading } = useCriticalLoading();

  const visible = useDeferredVisibility(isLoading, {
    delayMs: 200,
    minVisibleMs: 400,
  });

  const target = typeof document === "undefined" ? undefined : document.body;

  useEffect(() => {
    const main = document?.getElementById("app-root");
    if (!main) return;
    if (visible) {
      main.setAttribute("aria-busy", "true");
    } else {
      main.removeAttribute("aria-busy");
    }
  }, [visible]);

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
