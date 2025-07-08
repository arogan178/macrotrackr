import { useEffect, useState, useRef, useCallback } from "react";
import { NotificationType } from "../types";
import {
  CheckIcon,
  CloseIcon,
  WarningIcon,
  InfoIcon,
} from "@/components/Icons";
import FormButton from "@/components/form/FormButton";

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
  const progressRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const animationStartedRef = useRef(false);

  // Memoize handleClose to prevent unnecessary effect re-runs
  const handleClose = useCallback(() => {
    // Clear any pending timers to avoid duplicate closes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsLeaving(true);

    // Only trigger the actual onClose after fade-out animation completes
    setTimeout(() => {
      onClose();
    }, 500); // Animation duration for exit
  }, [onClose]);

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
      !progressRef.current ||
      animationStartedRef.current ||
      !autoClose
    )
      return;

    animationStartedRef.current = true;
    const progressEl = progressRef.current;

    // Set up the animation programmatically for better control
    progressEl.style.transition = `width ${duration}ms linear`;

    // Ensure we start at full width
    progressEl.style.width = "100%";

    // Force a reflow to make sure the initial state is rendered
    void progressEl.offsetWidth;

    // Small delay to ensure proper render sequence
    const startAnimation = () => {
      if (progressEl) {
        progressEl.style.width = "0%";

        // Set up the auto-close timer to match exactly with animation end
        timerRef.current = window.setTimeout(() => {
          if (!isLeaving) {
            handleClose();
          }
        }, duration);
      }
    };

    const animationTimer = setTimeout(startAnimation, 20);

    return () => {
      clearTimeout(animationTimer);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible, duration, isLeaving, handleClose, autoClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Style mappings for notification types
  const styles = {
    success: {
      bg: "bg-gradient-to-r from-green-900/90 to-green-800/90",
      border: "border-green-500/30",
      icon: "text-green-400",
      progress: "bg-green-500/50",
      component: <CheckIcon className="w-5 h-5" />,
    },
    error: {
      bg: "bg-gradient-to-r from-red-900/90 to-red-800/90",
      border: "border-red-500/30",
      icon: "text-red-400",
      progress: "bg-red-500/50",
      component: <CloseIcon className="w-5 h-5" />,
    },
    warning: {
      bg: "bg-gradient-to-r from-yellow-700/90 to-amber-700/90",
      border: "border-yellow-500/30",
      icon: "text-yellow-400",
      progress: "bg-yellow-500/50",
      component: <WarningIcon className="w-5 h-5" />,
    },
    info: {
      bg: "bg-gradient-to-r from-blue-900/90 to-blue-800/90",
      border: "border-blue-500/30",
      icon: "text-blue-400",
      progress: "bg-blue-500/50",
      component: <InfoIcon className="w-5 h-5" />,
    },
  };

  const { bg, border, icon, progress, component } = styles[type];

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 sm:w-96 
                 transition-all duration-500 ease-in-out transform
                 ${
                   isVisible && !isLeaving
                     ? "opacity-100 translate-y-0"
                     : "opacity-0 -translate-y-4"
                 }
                 ${isLeaving ? "opacity-0 -translate-y-4" : ""}`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`flex items-center rounded-lg shadow-xl backdrop-blur-sm 
                     ${bg} border ${border} overflow-hidden`}
      >
        {/* Icon section */}
        <div className={`${icon} p-4 flex items-center justify-center`}>
          {component}
        </div>

        {/* Content area */}
        <div className="py-3 px-4 flex-1">
          <p className="text-white font-medium text-sm">{message}</p>
        </div>

        {/* Close button */}
        <FormButton
          type="button"
          onClick={handleClose}
          variant="ghost"
          size="sm"
          className="p-3 h-full text-white/70 hover:text-white"
          ariaLabel="Close notification"
          icon={<CloseIcon className="w-4 h-4" />}
        />

        {/* Progress timer bar */}
        {duration > 0 && autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 overflow-hidden">
            <div
              ref={progressRef}
              className={`h-full ${progress}`}
              style={{ width: "100%" }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingNotification;
