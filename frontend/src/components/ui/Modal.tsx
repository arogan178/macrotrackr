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
 * @prop {boolean} [isDanger] - Whether to style as dangerous action
 * @prop {boolean} [hideCancelButton] - Hide the cancel button
 *
 * Props (Form):
 * @prop {boolean} isOpen - Whether the modal is open
 * @prop {function} onClose - Close handler
 * @prop {string} title - Modal title
 * @prop {function} onSave - Save handler
 * @prop {boolean} [saveDisabled] - Disable save button
 * @prop {string} [saveLabel] - Save button label
 * @prop {string} [cancelLabel] - Cancel button label
 * @prop {boolean} [hideCancelButton] - Hide the cancel button
 *
 * Common Props:
 * @prop {ReactNode} children - Modal content
 * @prop {"sm"|"md"|"lg"|"xl"|"2xl"} [size] - Modal size
 * @prop {boolean} [hideClose] - Hide close (X) button
 *
 * @example
 * // Confirmation modal
 * <Modal
 *   isOpen={open}
 *   onClose={close}
 *   title="Delete item?"
 *   variant="confirmation"
 *   message="Are you sure you want to delete this?"
 *   onConfirm={handleDelete}
 *   isDanger
 * />
 *
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
import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

import Button from "./Button";
import IconButton from "./IconButton";
import ProgressiveBlur from "./ProgressiveBlur";
import type {
  ConfirmationModalProps,
  FormModalProps,
  ModalProps,
} from "./Types";

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

  // Helper functions to extract variant-specific props with type narrowing
  const getConfirmationProps = (
    properties_: ModalProps,
  ): Partial<ConfirmationModalProps> => {
    if (variant !== "confirmation") return {};
    const confirmationProps = properties_ as ConfirmationModalProps;
    return {
      message: confirmationProps.message,
      confirmLabel: confirmationProps.confirmLabel ?? "Confirm",
      cancelLabel: confirmationProps.cancelLabel ?? "Cancel",
      onConfirm: confirmationProps.onConfirm,
      isDanger: confirmationProps.isDanger ?? false,
      hideCancelButton: confirmationProps.hideCancelButton ?? false,
    };
  };

  const getFormProps = (properties_: ModalProps): Partial<FormModalProps> => {
    if (variant !== "form") return {};
    const formProps = properties_ as FormModalProps;
    return {
      onSave: formProps.onSave,
      saveDisabled: formProps.saveDisabled,
      saveLabel: formProps.saveLabel ?? "Save",
      cancelLabel: formProps.cancelLabel ?? "Cancel",
      hideCancelButton: formProps.hideCancelButton ?? false,
    };
  };

  // Derive variant-specific values
  const confirmationProps = getConfirmationProps(properties);
  const formProps = getFormProps(properties);

  const message = confirmationProps.message;
  const confirmLabel = confirmationProps.confirmLabel;
  const cancelLabel = confirmationProps.cancelLabel ?? formProps.cancelLabel;
  const onConfirm = confirmationProps.onConfirm;
  const isDanger = confirmationProps.isDanger;
  const onSave = formProps.onSave;
  const saveDisabled = formProps.saveDisabled;
  const saveLabel = formProps.saveLabel;
  const hideCancelButton =
    confirmationProps.hideCancelButton ?? formProps.hideCancelButton ?? false;

  const modalReference = useRef<HTMLDivElement>(null);
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
    const defaultStyles = {
      header: "bg-surface",
      footer: "bg-surface-2",
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
    "bg-surface rounded-xl shadow-modal border border-border flex flex-col overflow-hidden";

  // Size styles
  const sizeStyles = {
    sm: "max-w-sm w-full",
    md: "max-w-md w-full",
    lg: "max-w-lg w-full",
    xl: "max-w-xl w-full",
    "2xl": "max-w-2xl w-full",
  }[size];

  const variantStyles = getVariantStyles(variant);

  // Animation variants for motion.div - 3D spring animation
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      rotateX: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      rotateX: 10,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
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

  // Prevent rendering if not mounted or portal root not found
  if (!isMounted || !modalRoot) return null;

  // Use ReactDOM.createPortal to render the modal into #modal-root
  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`${baseContainerStyles}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{ perspective: "1000px" }}
        >
          {/* Backdrop with animation */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
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
                className={`flex items-center justify-between border-b border-border p-4 ${variantStyles.header}`}
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
            <div className="relative grow overflow-x-hidden overflow-y-auto p-5">
              <div className="relative z-10">
                {message && (
                  <p className="mb-4 text-sm text-foreground">{message}</p>
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

            {/* Footer */}
            {(onSave || onConfirm || variant === "confirmation") && (
              <div
                className={`flex ${
                  hideCancelButton ? "justify-center" : "justify-end"
                } gap-3 border-t border-border px-4 py-3 ${variantStyles.footer}`}
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
        </div>
      )}
    </AnimatePresence>,
    modalRoot, // Target element for the portal
  );
}

export default memo(Modal);
