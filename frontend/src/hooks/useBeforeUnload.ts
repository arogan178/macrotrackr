import { useEffect } from "react";

/**
 * Hook to prompt user when trying to leave page with unsaved changes
 * @param hasUnsavedChanges Boolean indicating if there are unsaved changes
 * @param message Message to show in the confirmation dialog
 */
export function useBeforeUnload(
  hasUnsavedChanges: boolean,
  message: string = "You have unsaved changes. Are you sure you want to leave?",
) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        // Modern browsers ignore the custom message, but setting returnValue triggers the dialog
        event.returnValue = "";
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}
