import { useEffect,useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { AnimatePresence,motion } from "motion/react";

import { cn } from "@/lib/classnameUtilities";

export function InfoTooltip({ text, className }: { text: string; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerReference = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible && triggerReference.current) {
      const rect = triggerReference.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isVisible]);

  return (
    <>
      <button
        ref={triggerReference}
        type="button"
        aria-label="More information"
        className={cn("relative flex items-center justify-center focus:outline-none", className)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Info className="h-4 w-4 cursor-pointer text-muted transition-colors hover:text-foreground" />
      </button>

      {globalThis.window !== undefined &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "fixed",
                  top: position.top,
                  left: position.left,
                  transform: "translate(-50%, -100%)",
                }}
                className="pointer-events-none z-[9999] w-48 rounded-lg border border-border/50 bg-surface-3 p-2 text-center text-xs text-foreground shadow-xl"
              >
                {text}
                <div className="absolute top-full left-1/2 -mt-[1px] -translate-x-1/2 border-[5px] border-transparent border-t-border/50" />
                <div className="absolute top-full left-1/2 -mt-[2px] -translate-x-1/2 border-[5px] border-transparent border-t-surface-3" />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
