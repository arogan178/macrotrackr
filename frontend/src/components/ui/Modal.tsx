/**
 * Modal – Accessible, animated modal dialog for confirmation and form flows.
 *
 * Renders in a portal (#modal-root), supports keyboard and backdrop close, and provides two variants:
 * - Confirmation: For yes/no or destructive actions
 * - Form: For embedded forms with Save/Cancel
 *
 * Accessibility:
 * - Uses role="dialog", aria-modal, and aria-labelledby for screen readers.
 * - Focus is trapped within the modal while open.
 *
 * Props (Confirmation):
 * @prop {boolean} isOpen - Whether the modal is open
 * @prop {function} onClose - Close handler
 * @prop {string} title - Modal title
 * @prop {string} message - Confirmation message
 * @prop {function} onConfirm - Confirm handler
 * @prop {string} [confirmLabel] - Confirm button label
 * @prop {string} [cancelLabel] - Cancel button label
  let message: string | undefined,
    confirmLabel: string | undefined,
    cancelLabel: string | undefined,
    onConfirm: (() => void) | undefined,
    isDanger: boolean | undefined,
    hideCancelButton: boolean = false,
    onSave: (() => void) | undefined,
    saveDisabled: boolean | undefined,
    saveLabel: string | undefined;
 * Common Props:
 * @prop {ReactNode} children - Modal content
 * @prop {"sm"|"md"|"lg"|"xl"|"2xl"} [size] - Modal size
 * @prop {boolean} [hideClose] - Hide close (X) button
 *
 * @example
 * <Modal
      hideCancelButton,
 *   onClose={close}
 *   title="Delete item?"
 *   variant="confirmation"
 *   message="Are you sure you want to delete this?"
 *   onConfirm={handleDelete}
 * />
  hideCancelButton = false, // Set default for hideCancelButton here
      hideCancelButton,
 * @example
 * // Form modal
 * <Modal
 *   isOpen={open}
 *   onClose={close}
 *   title="Edit Profile"
 *   variant="form"
 *   onSave={handleSave}
 *   saveDisabled={isSaving}
 * >
 *   <ProfileForm />
 * </Modal>
 */
import { motion } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

import type {
  ConfirmationModalProps,
  FormModalProps,
  ModalProps,
} from "../utils/Types";
import Button from "./Button";
import IconButton from "./IconButton";

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

  // Discriminated union for variant-specific props
  const variant: ConfirmationModalProps["variant"] | FormModalProps["variant"] =
    (properties as ModalProps & { variant: "confirmation" | "form" }).variant;
  let message: string | undefined,
    confirmLabel: string | undefined,
    cancelLabel: string | undefined,
    onConfirm: (() => void) | undefined,
    isDanger: boolean | undefined,
    onSave: (() => void) | undefined,
    saveDisabled: boolean | undefined,
    saveLabel: string | undefined,
    hideCancelButton = false;
  if (variant === "confirmation") {
    ({
      message,
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      onConfirm,
      isDanger = false,
      hideCancelButton = false,
    } = properties as ConfirmationModalProps);
  } else if (variant === "form") {
    ({
      onSave,
      saveDisabled,
      saveLabel = "Save",
      cancelLabel = "Cancel",
      hideCancelButton = false,
    } = properties as FormModalProps);
  }
  const modalReference = useRef<HTMLDivElement>(undefined);
  const modalRoot = document.querySelector("#modal-root"); // Get the portal target

  // Handle escape key press and body scroll lock
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.classList.add("modal-open");
      globalThis.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.classList.remove("modal-open");
    }

    // Cleanup function
    return () => {
      document.body.classList.remove("modal-open"); // Ensure class is removed on unmount
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Get variant specific styles - Restore default header/footer backgrounds
  const getVariantStyles = (variant: string) => {
    // Define default styles matching the base content background
    const defaultStyles = {
      header: "bg-surface/80",
      footer: "bg-surface/80",
      confirmButton: "",
    };

    switch (variant) {
      case "confirmation": {
        return {
          // Use default header/footer for uniform look, override only confirm button
          ...defaultStyles,
          confirmButton: isDanger
            ? "bg-error text-foreground hover:bg-error"
            : "bg-primary text-foreground hover:bg-primary",
        };
      }
      case "form": {
        return {
          ...defaultStyles, // Use default header/footer
          confirmButton: "bg-primary text-foreground hover:bg-primary",
        };
      }
      default: {
        return defaultStyles;
      }
    }
  };

  // Base styles for the modal container
  const baseContainerStyles =
    "fixed inset-0 z-50 flex items-center justify-center p-4";

  // Base styles for the modal content
  const baseContentStyles =
    "bg-surface/80 backdrop-blur-lg rounded-xl shadow-modal border border-border/50 flex flex-col overflow-hidden";

  // Size styles
  const sizeStyles = {
    sm: "max-w-sm w-full",
    md: "max-w-md w-full",
    lg: "max-w-lg w-full",
    xl: "max-w-xl w-full",
    "2xl": "max-w-2xl w-full",
  }[size];

  const variantStyles = getVariantStyles(variant);

  // Animation variants for motion.div
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.15,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  // State to manage mounting for portal
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Prevent rendering if not open or not mounted or portal root not found
  if (!isOpen || !isMounted || !modalRoot) return;

  // Use ReactDOM.createPortal to render the modal into #modal-root
  return ReactDOM.createPortal(
    <div
      className={`${baseContainerStyles}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop with animation */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose} // Close on backdrop click
      />

      {/* Modal Content with animation */}
      <motion.div
        ref={modalReference}
        className={`${baseContentStyles} ${sizeStyles} relative`}
        style={{ overflowX: "hidden" }}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header: Only render if close button is shown */}
        {!hideClose && (
          <div
            className={`flex items-center justify-between border-b border-border/50 p-4 ${variantStyles.header}`}
          >
            <h2
              id="modal-title"
              className="text-lg font-medium text-foreground"
            >
              {title}
            </h2>
            <IconButton
              variant="close"
              iconSize={buttonSize}
              buttonSize={buttonSize}
              onClick={onClose}
              ariaLabel="Close modal"
              className="hover:text-red text-foreground transition-colors"
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-grow overflow-x-hidden overflow-y-hidden p-5">
          {message && <p className="mb-4 text-sm text-foreground">{message}</p>}
          {children}
        </div>

        {/* Footer */}
        {(onSave || onConfirm || variant === "confirmation") && (
          <div
            className={`flex ${
              hideCancelButton ? "justify-center" : "justify-end"
            } gap-4 border-t border-border/50 p-4 ${variantStyles.footer}`}
          >
            {!hideCancelButton && (
              <Button
                onClick={onClose}
                ariaLabel={cancelLabel}
                variant="secondary"
                buttonSize={buttonSize}
                className="rounded-lg bg-surface/60 px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface/90"
              >
                {cancelLabel}
              </Button>
            )}
            {variant === "form" && onSave && (
              <Button
                type="button"
                onClick={onSave}
                disabled={saveDisabled}
                text={saveLabel}
                buttonSize={buttonSize}
                variant="primary"
                className="px-8 py-3 text-lg"
              />
            )}
            {variant === "confirmation" && onConfirm && (
              <Button
                onClick={onConfirm}
                ariaLabel={confirmLabel}
                variant={isDanger ? "danger" : "primary"}
                buttonSize={buttonSize}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${variantStyles.confirmButton}`}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>,
    modalRoot, // Target element for the portal
  );
}

export default memo(Modal);
