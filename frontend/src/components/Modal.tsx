import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { WarningIcon, InfoIcon } from "./Icons";
import { FormButton } from "./form";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

interface ConfirmationModalProps extends BaseModalProps {
  variant: "confirmation";
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDanger?: boolean;
}

interface FormModalProps extends BaseModalProps {
  variant: "form";
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  hideDefaultButtons?: boolean;
}

type ModalProps = ConfirmationModalProps | FormModalProps;

export default function Modal(props: ModalProps) {
  const { isOpen, onClose, title, size = "md" } = props;
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key press to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap & scroll lock
  useEffect(() => {
    if (isOpen) {
      // Save current active element to restore focus later
      initialFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";

      // Set up focus trap without initial focus stealing
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === "Tab" && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (!focusableElements.length) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      window.addEventListener("keydown", handleTabKey);
      return () => {
        window.removeEventListener("keydown", handleTabKey);
        document.body.style.overflow = "";
        // Restore focus to previous element when modal closes
        initialFocusRef.current?.focus();
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Size classes for the modal
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[size];

  const renderConfirmationContent = (props: ConfirmationModalProps) => {
    const {
      message,
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      onConfirm,
      isDanger = false,
    } = props;

    return (
      <>
        <div className="sm:flex sm:items-start">
          {isDanger ? (
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
              <WarningIcon className="h-6 w-6 text-red-400" />
            </div>
          ) : (
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-900/20 sm:mx-0 sm:h-10 sm:w-10">
              <InfoIcon className="h-6 w-6 text-indigo-400" />
            </div>
          )}

          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3
              className="text-lg font-semibold leading-6 text-gray-200"
              id="modal-title"
            >
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-400">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          {cancelLabel && (
            <FormButton
              variant="secondary"
              onClick={onClose}
              size="md"
              ariaLabel="Cancel"
            >
              {cancelLabel}
            </FormButton>
          )}
          {confirmLabel && (
            <FormButton
              variant={isDanger ? "danger" : "primary"}
              onClick={onConfirm}
              size="md"
              ariaLabel={confirmLabel}
            >
              {confirmLabel}
            </FormButton>
          )}
        </div>
      </>
    );
  };

  const renderFormContent = (props: FormModalProps) => {
    const {
      children,
      onSave,
      saveDisabled,
      saveLabel = "Save",
      cancelLabel = "Cancel",
      hideDefaultButtons = false,
    } = props;

    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-200" id="modal-title">
            {title}
          </h3>
        </div>

        {children}

        {!hideDefaultButtons && (
          <div className="mt-6 flex justify-end gap-3">
            <FormButton
              variant="secondary"
              onClick={onClose}
              size="md"
              ariaLabel={cancelLabel}
            >
              {cancelLabel}
            </FormButton>
            {onSave && (
              <FormButton
                onClick={onSave}
                disabled={saveDisabled}
                variant="primary"
                size="md"
                ariaLabel={saveLabel}
              >
                {saveLabel}
              </FormButton>
            )}
          </div>
        )}
      </>
    );
  };

  const renderContent = () => {
    switch (props.variant) {
      case "confirmation":
        return renderConfirmationContent(props);
      case "form":
        return renderFormContent(props);
      default:
        return null;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={`relative z-50 w-full ${sizeClasses} transform rounded-2xl bg-gray-800/90 p-6 shadow-xl transition-all duration-300 ease-out ${
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          tabIndex={-1}
        >
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body
  );
}
