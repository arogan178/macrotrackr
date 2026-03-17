import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const VISIBILITY_OFFSET = 480;
const REMAINING_PAGE_THRESHOLD = 0.4;

const buttonClasses =
  "fixed right-6 bottom-36 z-40 inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/92 px-3 py-3 text-sm font-medium text-foreground shadow-lg backdrop-blur-md transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:border-primary/40 hover:bg-surface hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none sm:right-8 sm:bottom-32 sm:px-4";

const buttonVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.96,
    transition: { duration: 0.14, ease: "easeIn" as const },
  },
} as const;

interface BackToTopButtonProps {
  offset?: number;
  className?: string;
  label?: string;
}

const BackToTopButton = memo(function BackToTopButton({
  offset = VISIBILITY_OFFSET,
  className = "",
  label = "Back to top",
}: BackToTopButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const frameReference = useRef<number | null>(null);

  useEffect(() => {
    setPortalTarget(globalThis.document.body);
  }, []);

  useEffect(() => {

    const updateVisibility = () => {
      frameReference.current = null;
      const maxScroll = Math.max(
        globalThis.document.documentElement.scrollHeight -
          globalThis.innerHeight,
        0,
      );

      if (maxScroll === 0) {
        setIsVisible(false);

        return;
      }

      const triggerPoint = Math.max(
        offset,
        maxScroll * (1 - REMAINING_PAGE_THRESHOLD),
      );
      const nextVisible = globalThis.scrollY >= triggerPoint;

      setIsVisible((previous) =>
        previous === nextVisible ? previous : nextVisible,
      );
    };

    const handleScroll = () => {
      if (frameReference.current !== null) {
        return;
      }

      frameReference.current =
        globalThis.requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    globalThis.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frameReference.current !== null) {
        globalThis.cancelAnimationFrame(frameReference.current);
      }
      globalThis.removeEventListener("scroll", handleScroll);
    };
  }, [offset]);

  const scrollToTop = () => {
    globalThis.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  const button = (
    <AnimatePresence>
      {isVisible ? (
        <motion.button
          type="button"
          aria-label={label}
          onClick={scrollToTop}
          className={`${buttonClasses} ${className}`.trim()}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          exit="exit"
          variants={buttonVariants}
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          <span className="hidden sm:inline">{label}</span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );

  if (!portalTarget) {
    return button;
  }

  return createPortal(button, portalTarget);
});

export default BackToTopButton;
