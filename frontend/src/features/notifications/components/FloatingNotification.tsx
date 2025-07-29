import { useCallback, useEffect, useRef, useState } from "react";

import { ActionButton } from "@/components/form";
import { CheckIcon, CloseIcon, InfoIcon, WarningIcon } from "@/components/ui";

import type { NotificationType } from "../types";

export interface FloatingNotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
  autoClose?: boolean;
}

function FloatingNotification({
  message,
  type = "info",
  onClose,
  duration = 5000,
  autoClose = true,
}: FloatingNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const progressReference = useRef<HTMLDivElement>(null);
  const timerReference = useRef<number | undefined>(undefined);
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
      if (progressElement && !isLeaving) {
        progressElement.style.width = "0%";

        // Set up the auto-close timer to match exactly with animation end
        timerReference.current = globalThis.setTimeout(() => {
          if (!isLeaving) {
            handleClose();
          }
        }, duration);
      }
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
      icon: "text-green-300",
      progress: "bg-green-400",
      component: <CheckIcon className="w-5 h-5" />,
    },
    error: {
      bg: "bg-gradient-to-r from-red-900/95 to-red-800/95",
      border: "border-red-500/40",
      icon: "text-red-300",
      progress: "bg-red-400",
      component: <CloseIcon className="w-5 h-5" />,
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-800/95 to-yellow-700/95",
      border: "border-amber-500/40",
      icon: "text-amber-300",
      progress: "bg-amber-400",
      component: <WarningIcon className="w-5 h-5" />,
    },
    info: {
      bg: "bg-gradient-to-r from-blue-900/95 to-blue-800/95",
      border: "border-blue-500/40",
      icon: "text-blue-300",
      progress: "bg-blue-400",
      component: <InfoIcon className="w-5 h-5" />,
    },
  };

  const { bg, border, icon, progress, component } = styles[type];

  return (
    <div
      className={`relative max-w-md w-full mx-auto
                 transition-all duration-300 ease-out transform
                 ${
                   isVisible && !isLeaving
                     ? "opacity-100 translate-y-0 scale-100"
                     : "opacity-0 -translate-y-4 scale-95"
                 }`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className={`flex items-center rounded-lg shadow-2xl backdrop-blur-md 
                     ${bg} border ${border} overflow-hidden
                     hover:shadow-3xl transition-shadow duration-200`}
      >
        {/* Icon section */}
        <div
          className={`${icon} p-4 flex items-center justify-center flex-shrink-0`}
        >
          {component}
        </div>

        {/* Content area */}
        <div className="py-3 px-4 flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-relaxed break-words">
            {message}
          </p>
        </div>

        {/* Close button */}
        <div className="flex-shrink-0 p-2">
          <ActionButton
            variant="close"
            onClick={handleClose}
            ariaLabel="Close notification"
            className="text-white/60 hover:text-white bg-transparent hover:bg-white/10"
          />
        </div>

        {/* Progress timer bar */}
        {duration > 0 && autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 overflow-hidden">
            <div
              ref={progressReference}
              className={`h-full ${progress} transition-all ease-linear`}
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingNotification;
