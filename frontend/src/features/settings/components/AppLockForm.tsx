import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import Panel from "@/components/ui/Panel";
import type { BiometricAvailability } from "@/services/biometrics";
import { useStore } from "@/store/store";

// Loaded on demand so the web build never downloads the native plugins.
const loadBiometrics = () => import("@/services/biometrics");

/**
 * The app lock setting. Native only, and only once the device has a
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

  const handleChange = async (next: boolean) => {
    setIsSaving(true);
    try {
      const { setAppLockEnabled, verifyBiometricIdentity } =
        await loadBiometrics();
      if (
        next &&
        !(await verifyBiometricIdentity(
          "Confirm it's you to turn on the app lock",
        ))
      ) {
        return;
      }
      await setAppLockEnabled(next);
      setEnabled(next);
      showNotification(next ? "App lock on" : "App lock off", "success");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel
      title="App lock"
      description={`Ask for ${availability.biometryType === "Biometrics" ? "your fingerprint or face" : availability.biometryType} when MacroTrackr opens, and after 5 minutes away.`}
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
        Require unlock to open the app
      </label>
    </Panel>
  );
};

export default AppLockForm;
