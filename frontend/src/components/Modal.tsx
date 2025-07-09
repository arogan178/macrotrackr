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
 * @prop {boolean} [isDanger] - Use danger styling
 * @prop {boolean} [hideCancelButton] - Hide cancel button
 *
 * Props (Form):
 * @prop {function} onSave - Save handler
 * @prop {boolean} [saveDisabled] - Disable save button
 * @prop {string} [saveLabel] - Save button label
 * @prop {string} [cancelLabel] - Cancel button label
 * @prop {boolean} [hideDefaultButtons] - Hide default footer buttons
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

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "@/components/Icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  ariaLabel?: string;
  // Confirmation variant
  variant?: "confirmation" | "form";
  message?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  hideCancelButton?: boolean;
  // Form variant
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  hideDefaultButtons?: boolean;
}

// Utility: get safe area insets for iOS
const getSafeArea = () => "env(safe-area-inset-bottom,0px)";

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
  showCloseButton = true,
  ariaLabel,
  variant,
  message,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  hideCancelButton = false,
  onSave,
  saveDisabled = false,
  saveLabel = "Save",
  hideDefaultButtons = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement;
    const modal = modalRef.current;
    if (modal) {
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) focusable[0].focus();
    }
    return () => {
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
          aria-label={ariaLabel || title}
        >
          <motion.div
            ref={modalRef}
            className={`relative bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-lg mx-2 sm:mx-0
              max-h-[calc(100dvh-2rem)] sm:max-h-[90vh]
              min-h-[40dvh] sm:min-h-0
              flex flex-col
              ${className}`}
            style={{
              // Add safe area for iOS
              paddingBottom: getSafeArea(),
            }}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            tabIndex={-1}
          >
            {/* Sticky header for mobile */}
            {(title || showCloseButton) && (
              <div className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-zinc-900 px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                {title && (
                  <div
                    className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 pr-2 truncate"
                    style={{ maxWidth: "80%" }}
                  >
                    {title}
                  </div>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all w-12 h-12 flex items-center justify-center"
                    aria-label="Close modal"
                    tabIndex={0}
                  >
                    <CloseIcon size="sm" />
                  </button>
                )}
              </div>
            )}
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {/* Confirmation message for confirmation variant */}
              {variant === "confirmation" && message && (
                <div className="mb-4 text-base text-zinc-700 dark:text-zinc-200">
                  {message}
                </div>
              )}
              {children}
            </div>
            {/* Sticky footer for mobile */}
            {(footer ||
              variant === "confirmation" ||
              (variant === "form" && onSave && !hideDefaultButtons)) && (
              <div className="sticky bottom-0 z-10 bg-white dark:bg-zinc-900 px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0 flex justify-end gap-3">
                {/* Custom footer overrides everything */}
                {footer ? (
                  footer
                ) : variant === "confirmation" ? (
                  <>
                    {!hideCancelButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {cancelLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onConfirm}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isDanger
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {confirmLabel}
                    </button>
                  </>
                ) : variant === "form" && onSave && !hideDefaultButtons ? (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {cancelLabel}
                    </button>
                    <button
                      type="button"
                      onClick={onSave}
                      className="px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      disabled={saveDisabled}
                    >
                      {saveLabel}
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
