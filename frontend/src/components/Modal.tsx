import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { WarningIcon, InfoIcon } from "./Icons";
import { FormButton } from "./form/index";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
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
}

type ModalProps = ConfirmationModalProps | FormModalProps;

export default function Modal(props: ModalProps) {
  const { isOpen, onClose, title } = props;
  const modalRef = useRef<HTMLDivElement>(null);

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
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (props.variant === "confirmation") {
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
              <h3 className="text-lg font-semibold leading-6 text-gray-200">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-400">{message}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:w-auto ${
                isDanger
                  ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  : "bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800`}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600 sm:mt-0 sm:w-auto"
            >
              {cancelLabel}
            </button>
          </div>
        </>
      );
    }

    // Form variant
    const { children, onSave, saveDisabled } = props;
    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-200">{title}</h3>
        </div>

        {children}

        <div className="mt-6 flex justify-end gap-3">
          <FormButton
            text="Cancel"
            onClick={onClose}
            variant="secondary"
            isLoading={false}
          />
          {onSave && (
            <FormButton
              text="Save"
              onClick={onSave}
              isLoading={false}
              className={saveDisabled ? "opacity-50 cursor-not-allowed" : ""}
            />
          )}
        </div>
      </>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative z-50 w-full max-w-md transform rounded-2xl bg-gray-800/90 p-6 shadow-xl transition-all"
          tabIndex={-1}
        >
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body
  );
}
