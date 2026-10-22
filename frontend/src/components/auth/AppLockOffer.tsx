import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import Modal from "@/components/ui/Modal";
import { biometricLabel } from "@/services/biometricLabel";
import { useStore } from "@/store/store";

// Loaded on demand so the web build never downloads the native plugins.
const loadBiometrics = () => import("@/services/biometrics");

/**
 * Offers biometric sign-in once per device, after signing in, when the device
 * has a biometric and it is off. Declining or turning it off later is final.
 */
export function AppLockOffer() {
  const { showNotification } = useStore();
  const [label, setLabel] = useState<string>();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    void loadBiometrics().then(async (biometrics) => {
      const [availability, isEnabled, wasOffered] = await Promise.all([
        biometrics.checkBiometricAvailability(),
        biometrics.isAppLockEnabled(),
        biometrics.wasAppLockOffered(),
      ]);
      if (cancelled || !availability.isAvailable || isEnabled || wasOffered) {
        return;
      }
      await biometrics.markAppLockOffered();
      if (!cancelled) setLabel(biometricLabel(availability.biometryType));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!label) {
    return null;
  }

  const close = () => setLabel(undefined);

  const turnOn = async () => {
    const { setAppLockEnabled, verifyBiometricIdentity } =
      await loadBiometrics();
    if (
      !(await verifyBiometricIdentity(
        `Confirm it's you to turn on sign-in with ${label}`,
      ))
    ) {
      return;
    }
    await setAppLockEnabled(true);
    showNotification(`Sign-in with ${label} on`, "success");
    close();
  };

  return (
    <Modal
      isOpen
      onClose={close}
      variant="confirmation"
      title={`Sign in with ${label}?`}
      message={`MacroTrackr will ask for your ${label} when it opens, and after 5 minutes away. You can change this in Settings > Security.`}
      confirmLabel="Turn on"
      cancelLabel="Not now"
      onConfirm={() => void turnOn()}
    />
  );
}
