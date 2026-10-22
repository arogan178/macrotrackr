import { createPortal } from "react-dom";

import { LockIcon } from "@/components/ui/Icons";
import StateCard from "@/components/ui/StateCard";
import { useLogout } from "@/hooks/auth/useAuthQueries";

interface AppLockScreenProps {
  isChecking: boolean;
  onUnlock: () => void;
}

/**
 * Covers the signed-in app until the biometric check passes. Portalled out of
 * the layout, which goes inert while locked. Above modals (z-100), below
 * notifications (z-110).
 */
export function AppLockScreen({ isChecking, onUnlock }: AppLockScreenProps) {
  const logout = useLogout();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="MacroTrackr is locked"
      className="fixed inset-0 z-105 flex items-center justify-center bg-background px-4 pt-(--sat) pb-(--sab)"
    >
      {!isChecking && (
        <StateCard
          title="MacroTrackr is locked"
          message="Unlock with your fingerprint, face or device PIN."
          icon={
            <span className="inline-flex items-center justify-center rounded-full border border-border bg-surface-2 p-3.5">
              <LockIcon className="h-10 w-10 text-muted" strokeWidth={1.5} />
            </span>
          }
          action={{ label: "Unlock", onClick: onUnlock }}
          secondaryAction={{
            label: "Sign out",
            onClick: () => logout.mutate(),
            variant: "ghost",
          }}
        />
      )}
    </div>,
    document.body,
  );
}
