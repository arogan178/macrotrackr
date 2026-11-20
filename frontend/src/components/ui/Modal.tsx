import {
  memo,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, m } from "motion/react";

import { DURATIONS, EASINGS } from "@/components/utils/UiConstants";

import { cn } from "../../lib/classnameUtilities";

import Button from "./Button";
import IconButton from "./IconButton";
import type {
  ConfirmationModalProps,
  FormModalProps,
  ModalProps,
} from "./UiTypes";

// Track open modals in stacking order so Escape only closes the topmost dialog
// and closing a nested dialog keeps body scroll locked while the parent is open.
const openModalStack: string[] = [];

// Below md this is a bottom sheet: a centred dialog puts its actions and its
// close button at the least reachable part of a phone screen, and the keyboard
// covers the middle of the viewport exactly where the dialog sits.
const CONTAINER_CLASS =
  "fixed inset-0 z-100 flex items-end justify-center outline-none md:items-center md:p-6";
const CONTENT_CLASS =
  "relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-card border border-border bg-surface pb-[var(--sab)] md:max-h-[calc(100dvh-3rem)] md:rounded-card md:pb-0";
const SURFACE_CLASS = "bg-surface";
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SIZE_CLASS_MAP = {
  sm: "md:max-w-sm md:w-full",
  md: "md:max-w-md md:w-full",
  lg: "md:max-w-lg md:w-full",
  xl: "md:max-w-xl md:w-full",
  "2xl": "md:max-w-2xl md:w-full",
} as const;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -5,
    transition: {
      duration: DURATIONS.instant,
      ease: EASINGS.out,
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATIONS.base, ease: EASINGS.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATIONS.instant, ease: EASINGS.out },
  },
};

// The portal target only exists in the browser; prerendered pages and
// hydration render nothing here.
const subscribeToNothing = () => () => {};
const isClient = () => true;
const isServer = () => false;

function renderConfirmationFooter(
  properties: ConfirmationModalProps,
  onClose: () => void,
  buttonSize: NonNullable<ModalProps["buttonSize"]>,
) {
  const cancelLabel = properties.cancelLabel ?? "Cancel";
  const confirmLabel = properties.confirmLabel ?? "Confirm";
  const confirmVariant = properties.isDanger ? "danger" : "primary";
  const hideCancelButton = properties.hideCancelButton ?? false;

  return (
    <div
      className={cn(
        "flex gap-3 border-t border-border px-6 py-4",
        hideCancelButton ? "justify-center" : "justify-end",
        SURFACE_CLASS,
      )}
    >
      {!hideCancelButton && (
        <Button
          onClick={onClose}
          ariaLabel={cancelLabel}
          variant="ghost"
          buttonSize={buttonSize}
          className="font-medium text-muted hover:text-foreground"
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        onClick={properties.onConfirm}
        ariaLabel={confirmLabel}
        variant={confirmVariant}
        buttonSize={buttonSize}
        className="px-6 font-medium"
      >
        {confirmLabel}
      </Button>
    </div>
  );
}

function renderFormFooter(
  properties: FormModalProps,
  onClose: () => void,
  buttonSize: NonNullable<ModalProps["buttonSize"]>,
) {
  if (!properties.onSave || properties.hideDefaultButtons) {
    return null;
  }

  const cancelLabel = properties.cancelLabel ?? "Cancel";
  const saveLabel = properties.saveLabel ?? "Save";
  const hideCancelButton = properties.hideCancelButton ?? false;

  return (
    <div
      className={cn(
        "flex gap-3 border-t border-border px-6 py-4",
        hideCancelButton ? "justify-center" : "justify-end",
        SURFACE_CLASS,
      )}
    >
      {!hideCancelButton && (
        <Button
          onClick={onClose}
          ariaLabel={cancelLabel}
          variant="ghost"
          buttonSize={buttonSize}
          className="font-medium text-muted hover:text-foreground"
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="button"
        onClick={properties.onSave}
        disabled={properties.saveDisabled}
        text={saveLabel}
        buttonSize={buttonSize}
        variant="primary"
        className="px-6 font-medium"
      />
    </div>
  );
}

function Modal(properties: ModalProps) {
  const {
    isOpen,
    onClose,
    title,
    size = "md",
    buttonSize = "md",
    children,
    hideClose = false,
  } = properties;
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    isClient,
    isServer,
  );
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const [opened, setOpened] = useState<{
    isOpen: boolean;
    opener: Element | null;
  }>({
    isOpen: false,
    opener: null,
  });

  // Captured during render: a child's autoFocus has already moved focus by the
  // time effects run.
  if (opened.isOpen !== isOpen) {
    setOpened({
      isOpen,
      opener:
        isOpen && typeof document !== "undefined"
          ? document.activeElement
          : null,
    });
  }
  const { opener } = opened;

  useEffect(() => {
    if (!isOpen) return;

    openModalStack.push(modalId);
    document.body.classList.add("modal-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only the topmost modal handles keyboard dismissal and focus trapping.
      if (openModalStack[openModalStack.length - 1] !== modalId) {
        return;
      }

      if (event.key === "Escape") {
        onCloseRef.current();

        return;
      }

      const dialog = dialogRef.current;
      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusable =
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);

    return () => {
      const index = openModalStack.lastIndexOf(modalId);
      if (index !== -1) {
        openModalStack.splice(index, 1);
      }
      if (openModalStack.length === 0) {
        document.body.classList.remove("modal-open");
      }
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, modalId]);

  useEffect(() => {
    if (!isOpen || !isMounted) return;

    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      (dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? dialog).focus();
    }

    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [isOpen, isMounted, opener]);

  const modalRoot =
    typeof document === "undefined"
      ? null
      : document.querySelector("#modal-root");

  if (!isMounted || !modalRoot) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={CONTAINER_CLASS}
          role="dialog"
          aria-modal="true"
          aria-labelledby={!hideClose && title ? titleId : undefined}
          aria-label={hideClose && title ? title : undefined}
          tabIndex={-1}
          ref={dialogRef}
          style={{ perspective: "1000px" }}
        >
          <m.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          />

          <m.div
            className={cn(CONTENT_CLASS, SIZE_CLASS_MAP[size])}
            style={{ overflowX: "hidden" }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="document"
            onClick={(event) => event.stopPropagation()}
          >
            {!hideClose && (
              <div
                className={cn(
                  "flex items-center justify-between border-b border-border px-6 py-5",
                  SURFACE_CLASS,
                )}
              >
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  {title}
                </h2>
                <IconButton
                  variant="close"
                  iconSize={buttonSize}
                  buttonSize={buttonSize}
                  onClick={onClose}
                  ariaLabel="Close modal"
                  className="text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                />
              </div>
            )}

            <div className="relative grow overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-5">
              {properties.variant === "confirmation" && (
                <p className="mb-5 text-sm leading-relaxed text-muted">
                  {properties.message}
                </p>
              )}
              {children}
            </div>

            {properties.variant === "confirmation"
              ? renderConfirmationFooter(properties, onClose, buttonSize)
              : renderFormFooter(properties, onClose, buttonSize)}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    modalRoot,
  );
}

export default memo(Modal);
