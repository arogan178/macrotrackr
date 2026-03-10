import type { ReactNode } from "react";

import type { ICON_BUTTON_SIZES, ICON_SIZES } from "@/components/utils/Constants";

export type ButtonSize = keyof typeof ICON_BUTTON_SIZES;
export type IconSize = keyof typeof ICON_SIZES;

type ButtonVariant = "primary" | "secondary" | "neutral" | "danger" | "success" | "ghost" | "outline";
type ButtonType = "button" | "submit" | "reset";
type IconPosition = "left" | "right";

export interface ButtonProps {
  children?: ReactNode;
  text?: string;
  type?: ButtonType;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
  /** @deprecated Use leftIcon or rightIcon instead */
  icon?: ReactNode;
  /** @deprecated Use leftIcon or rightIcon instead */
  iconPosition?: IconPosition;
  /** Icon to display on the left side of the button text */
  leftIcon?: ReactNode;
  /** Icon to display on the right side of the button text */
  rightIcon?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  fullWidth?: boolean;
  ariaLabel?: string;
  autoLoadingFeature?:
    | "auth"
    | "habits"
    | "goals"
    | "macros"
    | "reports"
    | "settings";
  autoLoadingGlobal?: boolean;
}

export interface LoadingSpinnerProps {
  size?: IconSize;
  color?: string;
  label?: string;
}

export interface IconButtonGroupProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  editLabel?: string;
  deleteLabel?: string;
  buttonSize?: ButtonSize;
  iconSize?: IconSize;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  iconSize?: IconSize;
  buttonSize?: ButtonSize;
  hideClose?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export interface FormModalProps extends BaseModalProps {
  variant: "form";
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  hideDefaultButtons?: boolean;
  hideCancelButton?: boolean;
}

export interface ConfirmationModalProps extends BaseModalProps {
  variant: "confirmation";
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDanger?: boolean;
  hideCancelButton?: boolean;
}

export type ModalProps = ConfirmationModalProps | FormModalProps;
