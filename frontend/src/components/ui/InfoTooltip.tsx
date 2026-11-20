import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "motion/react";

import { DURATIONS, TOUCH_TARGET } from "@/components/utils/UiConstants";
import { cn } from "@/lib/classnameUtilities";

import { InfoIcon } from "./Icons";

const TOOLTIP_HALF_WIDTH = 96; // w-48 = 192px
const VIEWPORT_MARGIN = 12;

export function InfoTooltip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerReference = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!isVisible || !triggerReference.current) return;

    const rect = triggerReference.current.getBoundingClientRect();
    const minLeft = TOOLTIP_HALF_WIDTH + VIEWPORT_MARGIN;
    const maxLeft = Math.max(
      minLeft,
      globalThis.innerWidth - TOOLTIP_HALF_WIDTH - VIEWPORT_MARGIN,
    );
    const centeredLeft = rect.left + rect.width / 2;

    setPosition({
      top: rect.top - 8,
      left: Math.min(maxLeft, Math.max(minLeft, centeredLeft)),
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsVisible(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (
        triggerReference.current &&
        !triggerReference.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isVisible]);

  return (
    <>
      <button
        ref={triggerReference}
        type="button"
        aria-label="More information"
        aria-describedby={isVisible ? tooltipId : undefined}
        className={cn(
          TOUCH_TARGET,
          "flex items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          className,
        )}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onClick={() => setIsVisible((open) => !open)}
      >
        <InfoIcon className="h-4 w-4 cursor-pointer text-muted transition-colors hover:text-foreground" />
      </button>

      {globalThis.window !== undefined &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <m.div
                id={tooltipId}
                role="tooltip"
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: DURATIONS.instant }}
                style={{
                  position: "fixed",
                  top: position.top,
                  left: position.left,
                  transform: "translate(-50%, -100%)",
                }}
                className="pointer-events-none z-[9999] w-48 rounded-control border border-border bg-surface-3 p-2 text-center text-xs text-foreground"
              >
                {text}
                <div className="absolute top-full left-1/2 -mt-[1px] -translate-x-1/2 border-[5px] border-transparent border-t-border" />
                <div className="absolute top-full left-1/2 -mt-[2px] -translate-x-1/2 border-[5px] border-transparent border-t-surface-3" />
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
