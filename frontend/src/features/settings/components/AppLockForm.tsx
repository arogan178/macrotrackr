import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import Panel from "@/components/ui/Panel";
import { biometricLabel } from "@/services/biometricLabel";
import type { BiometricAvailability } from "@/services/biometrics";
import { useStore } from "@/store/store";

// Loaded on demand so the web build never downloads the native plugins.
const loadBiometrics = () => import("@/services/biometrics");

/**
 * The biometric sign-in setting (an app lock: the session stays signed in and
 * the biometric unlocks it). Native only, and only once the device has a
 * biometric enrolled. Turning it on asks for one first, so the user proves
 * they can unlock before the lock can shut them out.
 */
const AppLockForm = () => {
  const { showNotification } = useStore();
  const [availability, setAvailability] = useState<BiometricAvailability>();
  const [enabled, setEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    void loadBiometrics().then(
      async ({ checkBiometricAvailability, isAppLockEnabled }) => {
        const [result, isEnabled] = await Promise.all([
          checkBiometricAvailability(),
          isAppLockEnabled(),
        ]);
        if (cancelled) return;
        setAvailability(result);
        setEnabled(isEnabled);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (!availability?.isAvailable) {
    return null;
  }

  const label = biometricLabel(availability.biometryType);

  const handleChange = async (next: boolean) => {
    setIsSaving(true);
    try {
      const { setAppLockEnabled, verifyBiometricIdentity } =
        await loadBiometrics();
      if (
        next &&
        !(await verifyBiometricIdentity(
          `Confirm it's you to turn on sign-in with ${label}`,
        ))
      ) {
        return;
      }
      await setAppLockEnabled(next);
      setEnabled(next);
      showNotification(
        next ? `Sign-in with ${label} on` : `Sign-in with ${label} off`,
        "success",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel
      title={`Sign in with ${label}`}
      description={`Ask for your ${label} when MacroTrackr opens, and after 5 minutes away.`}
    >
      <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={enabled}
          disabled={isSaving}
          onChange={(event) => void handleChange(event.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
          name="app-lock"
        />
        Ask for my {label}
      </label>
    </Panel>
  );
};

export default AppLockForm;
