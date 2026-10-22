import { useCallback, useEffect, useRef, useState } from "react";

import {
  CheckIcon,
  CloseIcon,
  IconButton,
  InfoIcon,
  WarningIcon,
} from "@/components/ui";
import { cn } from "@/lib/classnameUtilities";

import type { NotificationAction, NotificationType } from "../NotificationTypes";

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface FloatingNotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
  autoClose?: boolean;
  action?: NotificationAction;
}

// One raised surface for every toast; the status is carried by the icon and
// the timer line in its token colour, not by a gradient fill per type.
const STATUS = {
  success: { Icon: CheckIcon, icon: "text-success", bar: "bg-success" },
  error: { Icon: WarningIcon, icon: "text-error", bar: "bg-error" },
  warning: { Icon: WarningIcon, icon: "text-warning", bar: "bg-warning" },
  info: { Icon: InfoIcon, icon: "text-primary", bar: "bg-primary" },
} as const;

const LEAVE_MS = 200;

/**
 * A snackbar: one line, an optional action, and a timer that waits while the
 * pointer or keyboard is on it, so there is always time to reach Undo.
 */
function FloatingNotification({
  message,
  type = "info",
  onClose,
  duration = 5000,
  autoClose = true,
  action,
}: FloatingNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const remainingReference = useRef(duration);
  const timerReference = useRef<TimerHandle | undefined>(undefined);
  const isTimed = autoClose && duration > 0;
  const status = STATUS[type];

  const handleClose = useCallback(() => {
    if (isLeaving) return;
    clearTimeout(timerReference.current);
    setIsLeaving(true);
    setTimeout(onClose, LEAVE_MS);
  }, [onClose, isLeaving]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);

    return () => clearTimeout(timer);
  }, []);

  // Counts down only while running; a pause banks what is left.
  useEffect(() => {
    if (!isTimed || isPaused || isLeaving) return;
    const startedAt = Date.now();
    timerReference.current = globalThis.setTimeout(handleClose, remainingReference.current);

    return () => {
      clearTimeout(timerReference.current);
      remainingReference.current -= Date.now() - startedAt;
    };
  }, [isTimed, isPaused, isLeaving, handleClose]);

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      className={cn(
        "transition-opacity duration-200 ease-out",
        isVisible && !isLeaving ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="relative flex items-center gap-3 overflow-hidden rounded-card border border-border-2 bg-surface-3 py-1.5 pr-1.5 pl-4 shadow-modal">
        <status.Icon className={cn("h-5 w-5 shrink-0", status.icon)} aria-hidden="true" />
        <p className="min-w-0 flex-1 py-2 text-sm break-words text-foreground">{message}</p>

        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              handleClose();
            }}
            className="min-h-11 shrink-0 rounded-control px-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {action.label}
          </button>
        )}

        <IconButton
          variant="custom"
          onClick={handleClose}
          ariaLabel="Close notification"
          icon={<CloseIcon className="h-4 w-4" />}
          className="shrink-0 text-muted hover:text-foreground"
        />

        {isTimed && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/8">
            <div
              className={cn("h-full origin-left", status.bar)}
              style={{
                animation: `toast-timer ${duration}ms linear forwards`,
                animationPlayState: isPaused ? "paused" : "running",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingNotification;
