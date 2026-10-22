import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FingerprintPattern, ScanFace } from "lucide-react";

import Button from "@/components/ui/Button";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { useLogout } from "@/hooks/auth/useAuthQueries";

interface AppLockScreenProps {
  isChecking: boolean;
  biometricLabel: string;
  onUnlock: () => void;
}

/**
 * Covers the signed-in app until the biometric check passes, dressed as the
 * sign-in page. The session is still there; "Sign in another way" ends it.
 * Above every other layer, notifications included, and everything else on the
 * page goes inert so modals and portals cannot be focused or read behind it.
 */
export function AppLockScreen({
  isChecking,
  biometricLabel,
  onUnlock,
}: AppLockScreenProps) {
  const logout = useLogout();
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const others = [...document.body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element !== screenRef.current &&
        !element.inert,
    );
    for (const element of others) element.inert = true;

    return () => {
      for (const element of others) element.inert = false;
    };
  }, []);

  const Icon = biometricLabel === "Face ID" ? ScanFace : FingerprintPattern;

  return createPortal(
    <div
      ref={screenRef}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to MacroTrackr"
      className="fixed inset-0 z-120 overflow-y-auto bg-background"
    >
      {!isChecking && (
        <AuthPageShell
          title="Welcome back"
          description={`Sign in with your ${biometricLabel} to pick up where you left off.`}
          showBackToHome={false}
        >
          <div className="space-y-3">
            <Button type="button" fullWidth onClick={onUnlock}>
              <span className="flex items-center justify-center gap-2">
                <Icon className="h-5 w-5" />
                <span>Sign in with {biometricLabel}</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => logout.mutate({ toSignIn: true })}
            >
              Sign in another way
            </Button>
          </div>
        </AuthPageShell>
      )}
    </div>,
    document.body,
  );
}
