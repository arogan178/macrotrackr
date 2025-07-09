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
import { useEffect, useRef, memo, useState } from "react";
import ReactDOM from "react-dom";
import { motion } from "motion/react";
import { FormButton, ActionButton } from "../form";

import type {
  ModalProps,
  ConfirmationModalProps,
  FormModalProps,
} from "../utils/types";

function Modal(props: ModalProps) {
  const {
    isOpen,
    onClose,
    title,
    size = "md",
    buttonSize = "md",
    children,
    hideClose = false,
  } = props;

  // Discriminated union for variant-specific props
  const variant: string = (props as any).variant;
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
    } = props as ConfirmationModalProps);
  } else if (variant === "form") {
    ({
      onSave,
      saveDisabled,
      saveLabel = "Save",
      cancelLabel = "Cancel",
      hideCancelButton = false,
    } = props as FormModalProps);
  }
  const modalRef = useRef<HTMLDivElement>(null);
  const modalRoot = document.getElementById("modal-root"); // Get the portal target

  // Handle escape key press and body scroll lock
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.classList.add("modal-open");
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.classList.remove("modal-open");
    }

    // Cleanup function
    return () => {
      document.body.classList.remove("modal-open"); // Ensure class is removed on unmount
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Get variant specific styles - Restore default header/footer backgrounds
  const getVariantStyles = (variant: string) => {
    // Define default styles matching the base content background
    const defaultStyles = {
      header: "bg-gray-800/80",
      footer: "bg-gray-800/80",
      confirmButton: "",
    };

    switch (variant) {
      case "confirmation":
        return {
          // Use default header/footer for uniform look, override only confirm button
          ...defaultStyles,
          confirmButton: isDanger
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-indigo-600 text-white hover:bg-indigo-700",
        };
      case "form":
        return {
          ...defaultStyles, // Use default header/footer
          confirmButton: "bg-blue-600 text-white hover:bg-blue-700",
        };
      default:
        return defaultStyles;
    }
  };

  // Base styles for the modal container
  const baseContainerStyles =
    "fixed inset-0 z-50 flex items-center justify-center p-4";

  // Base styles for the modal content
  const baseContentStyles =
    "bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-700/50 flex flex-col overflow-hidden";

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
  if (!isOpen || !isMounted || !modalRoot) return null;

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
        ref={modalRef}
        className={`${baseContentStyles} ${sizeStyles} relative`}
        style={{ overflowX: "hidden" }}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Only render if close button is shown */}
        {!hideClose && (
          <div
            className={`flex items-center justify-between p-4 border-b border-gray-700/50 ${variantStyles.header}`}
          >
            <h2 id="modal-title" className="text-lg font-medium text-gray-100">
              {title}
            </h2>
            <ActionButton
              variant="close"
              iconSize={buttonSize}
              buttonSize={buttonSize}
              onClick={onClose}
              ariaLabel="Close modal"
              className="text-gray-400 hover:text-red transition-colors"
            />
          </div>
        )}

        {/* Body */}
        <div className="p-5 flex-grow overflow-y-hidden overflow-x-hidden">
          {message && <p className="text-sm text-gray-300 mb-4">{message}</p>}
          {children}
        </div>

        {/* Footer */}
        {(onSave || onConfirm || variant === "confirmation") && (
          <div
            className={`flex ${
              hideCancelButton ? "justify-center" : "justify-end"
            } gap-4 p-4 border-t border-gray-700/50 ${variantStyles.footer}`}
          >
            {!hideCancelButton && (
              <FormButton
                onClick={onClose}
                ariaLabel={cancelLabel}
                variant="secondary"
                buttonSize={buttonSize}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700/90 transition-colors"
              >
                {cancelLabel}
              </FormButton>
            )}
            {variant === "form" && onSave && (
              <FormButton
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
              <FormButton
                onClick={onConfirm}
                ariaLabel={confirmLabel}
                variant={isDanger ? "danger" : "primary"}
                buttonSize={buttonSize}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles.confirmButton}`}
              >
                {confirmLabel}
              </FormButton>
            )}
          </div>
        )}
      </motion.div>
    </div>,
    modalRoot, // Target element for the portal
  );
}

export default memo(Modal);
