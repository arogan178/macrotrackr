import { useCallback, useEffect, useRef, useState } from "react";

import {
  CheckIcon,
  CloseIcon,
  IconButton,
  InfoIcon,
  WarningIcon,
} from "@/components/ui";

import type { NotificationType } from "../NotificationTypes";

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface FloatingNotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
  autoClose?: boolean;
  /**
   * Optional top offset for per-instance vertical positioning.
   * Accepts number (px) or any valid CSS length string.
   * If not provided, NotificationManager's container uses CSS var fallback.
   */
  topOffset?: number | string;
}

function FloatingNotification({
  message,
  type = "info",
  onClose,
  duration = 5000,
  autoClose = true,
  topOffset,
}: FloatingNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const progressReference = useRef<HTMLDivElement>(null);
  const timerReference = useRef<TimerHandle | undefined>(undefined);
  const animationStartedReference = useRef(false);

  // Memoize handleClose to prevent unnecessary effect re-runs
  const handleClose = useCallback(() => {
    // Prevent multiple close calls
    if (isLeaving) return;

    // Clear any pending timers to avoid duplicate closes
    if (timerReference.current) {
      clearTimeout(timerReference.current);
      timerReference.current = undefined;
    }

    setIsLeaving(true);

    // Only trigger the actual onClose after fade-out animation completes
    setTimeout(() => {
      onClose();
    }, 300); // Reduced animation duration for snappier feel
  }, [onClose, isLeaving]);

  // Handle mount animation
  useEffect(() => {
    // Small delay to ensure mount animation works
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Apply CSS animation to the progress bar and synchronize with auto-close
  useEffect(() => {
    // Only proceed if the notification is visible, has a duration, and animation hasn't started
    if (
      !isVisible ||
      duration <= 0 ||
      !progressReference.current ||
      animationStartedReference.current ||
      !autoClose ||
      isLeaving
    )
      return;

    animationStartedReference.current = true;
    const progressElement = progressReference.current;

    // Set up the animation programmatically for better control
    progressElement.style.transition = `width ${duration}ms linear`;
    progressElement.style.width = "100%";

    // Force a reflow to make sure the initial state is rendered
    void progressElement.offsetWidth;

    // Start the progress animation
    requestAnimationFrame(() => {
      progressElement.style.width = "0%";

      // Set up the auto-close timer to match exactly with animation end
      timerReference.current = globalThis.setTimeout(() => {
        handleClose();
      }, duration);
    });

    return () => {
      if (timerReference.current) {
        clearTimeout(timerReference.current);
      }
    };
  }, [isVisible, duration, isLeaving, handleClose, autoClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerReference.current) {
        clearTimeout(timerReference.current);
      }
    };
  }, []);

  // Style mappings for notification types
  const styles = {
    success: {
      bg: "bg-gradient-to-r from-green-900/95 to-green-800/95",
      border: "border-green-500/40",
      icon: "text-success",
      progress: "bg-success",
      component: <CheckIcon className="" />,
    },
    error: {
      bg: "bg-gradient-to-r from-red-900/95 to-red-800/95",
      border: "border-red-500/40",
      icon: "text-error",
      progress: "bg-vibrant-accent",
      component: <CloseIcon className="" />,
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-800/95 to-yellow-700/95",
      border: "border-amber-500/40",
      icon: "text-amber-300",
      progress: "bg-amber-400",
      component: <WarningIcon className="" />,
    },
    info: {
      bg: "bg-gradient-to-r from-primary/95 to-primary/95",
      border: "border-primary/40",
      icon: "text-primary",
      progress: "bg-primary",
      component: <InfoIcon className="" />,
    },
  };

  const { bg, border, icon, progress, component } = styles[type];

  // Resolve per-instance top offset if provided (used when this component is not inside the global manager or when overriding)
  const resolvedTop =
    typeof topOffset === "number" ? `${topOffset}px` : topOffset; // leave undefined if not provided

  return (
    <div
      className={`relative mx-auto w-full max-w-md
                 transform transition-[opacity,transform] duration-300 ease-out
                 ${
                   isVisible && !isLeaving
                     ? "translate-y-0 scale-100 opacity-100"
                     : "-translate-y-4 scale-95 opacity-0"
                 }`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={resolvedTop ? { marginTop: resolvedTop } : undefined}
    >
      <div
        className={`flex items-center rounded-lg shadow-modal backdrop-blur-md 
                     ${bg} border ${border}
                     overflow-hidden`}
      >
        {/* Icon section */}
        <div
          className={`${icon} flex flex-shrink-0 items-center justify-center p-4`}
        >
          {component}
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1 px-4 py-3">
          <p className="text-sm leading-relaxed font-medium break-words text-foreground">
            {message}
          </p>
        </div>

        {/* Close button */}
        <div className="flex-shrink-0 p-2">
          <IconButton
            variant="close"
            onClick={handleClose}
            ariaLabel="Close notification"
            className="bg-transparent text-foreground/60 hover:bg-surface/10 hover:text-foreground"
          />
        </div>

        {/* Progress timer bar */}
        {duration > 0 && autoClose && (
          <div className="absolute right-0 bottom-0 left-0 h-1 overflow-hidden bg-black/30">
            <div
              ref={progressReference}
              className={`h-full ${progress} transition-[width] ease-linear`}
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingNotification;
