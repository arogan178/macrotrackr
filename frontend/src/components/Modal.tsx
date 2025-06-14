import { ReactNode, useEffect, useRef, memo, useState } from "react";
import ReactDOM from "react-dom"; // Import ReactDOM for portals
import { motion } from "motion/react";
import { XIcon } from "./Icons";
import SaveButton from "./form/SaveButton";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
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

function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  variant,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isDanger = false,
  children,
  onSave,
  saveDisabled,
  saveLabel = "Save",
  hideDefaultButtons = false,
}: ModalProps) {
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
          // confirmButton style might not be needed if SaveButton is always used
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
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.15,
        ease: "easeIn",
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
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="document"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-700/50 ${variantStyles.header}`}
        >
          <h2 id="modal-title" className="text-lg font-medium text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700/50"
            aria-label="Close modal"
          >
            <XIcon size="md" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-grow overflow-y-auto">
          {message && <p className="text-sm text-gray-300 mb-4">{message}</p>}
          {children}
        </div>

        {/* Footer */}
        {(onSave || onConfirm || variant === "confirmation") && (
          <div
            className={`flex justify-end gap-4 p-4 border-t border-gray-700/50 ${variantStyles.footer}`}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700/90 transition-colors"
            >
              {cancelLabel}
            </button>
            {variant === "form" && onSave && (
              <SaveButton
                onClick={onSave}
                disabled={saveDisabled}
                label={saveLabel}
              />
            )}
            {variant === "confirmation" && onConfirm && (
              <button
                onClick={onConfirm}
                // Apply confirmButton style directly
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variantStyles.confirmButton}`}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>,
    modalRoot // Target element for the portal
  );
}

export default memo(Modal);
