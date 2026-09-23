export type NotificationType = "success" | "error" | "info" | "warning"; // Promote to shared if reused

export interface NotificationAction {
  label: string;
  onClick: () => void;
}
