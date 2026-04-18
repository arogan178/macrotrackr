import { memo, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "../../lib/classnameUtilities";

import Button from "./Button";
import IconButton from "./IconButton";
import ProgressiveBlur from "./ProgressiveBlur";
import type {
  ConfirmationModalProps,
  FormModalProps,
  ModalProps,
} from "./UiTypes";

const CONTAINER_CLASS =
  "fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6";
const CONTENT_CLASS =
  "relative flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl sm:max-h-[calc(100dvh-3rem)]";
const SURFACE_CLASS = "bg-surface/80 backdrop-blur-md";
const SIZE_CLASS_MAP = {
  sm: "max-w-sm w-full",
  md: "max-w-md w-full",
  lg: "max-w-lg w-full",
  xl: "max-w-xl w-full",
  "2xl": "max-w-2xl w-full",
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
      duration: 0.15,
      ease: "easeOut" as const,
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

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
        "flex gap-3 border-t border-white/5 px-6 py-4",
        hideCancelButton ? "justify-center" : "justify-end",
        SURFACE_CLASS,
      )}
    >
      {!hideCancelButton && (
        <Button
          onClick={onClose}
          ariaLabel={cancelLabel}
          variant="secondary"
          buttonSize={buttonSize}
          className="border-none bg-transparent font-medium text-muted shadow-none transition-colors hover:bg-white/5 hover:text-foreground"
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
        "flex gap-3 border-t border-white/5 px-6 py-4",
        hideCancelButton ? "justify-center" : "justify-end",
        SURFACE_CLASS,
      )}
    >
      {!hideCancelButton && (
        <Button
          onClick={onClose}
          ariaLabel={cancelLabel}
          variant="secondary"
          buttonSize={buttonSize}
          className="border-none bg-transparent font-medium text-muted shadow-none transition-colors hover:bg-white/5 hover:text-foreground"
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.classList.add("modal-open");
      globalThis.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

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
          aria-labelledby="modal-title"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
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
                  "flex items-center justify-between border-b border-white/5 px-6 py-5",
                  SURFACE_CLASS,
                )}
              >
                <h2
                  id="modal-title"
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
                  className="text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                />
              </div>
            )}

            <div className="relative grow overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-5">
              <div className="relative z-10">
                {properties.variant === "confirmation" && (
                  <p className="mb-5 text-sm leading-relaxed text-muted">
                    {properties.message}
                  </p>
                )}
                {children}
              </div>
              <ProgressiveBlur
                direction="up"
                intensity={0.3}
                height="50px"
                className="pointer-events-none z-0"
              />
            </div>

            {properties.variant === "confirmation"
              ? renderConfirmationFooter(properties, onClose, buttonSize)
              : renderFormFooter(properties, onClose, buttonSize)}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    modalRoot,
  );
}

export default memo(Modal);
