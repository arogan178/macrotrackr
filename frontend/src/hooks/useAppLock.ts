import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

import { biometricLabel } from "@/services/biometricLabel";

// Long enough that switching to another app and back does not lock.
export const LOCK_AFTER_BACKGROUND_MS = 5 * 60 * 1000;

const UNLOCK_REASON = "Unlock to see your log";

type LockState = "checking" | "locked" | "unlocked";

// Loaded on demand so the web build never downloads the native plugins, and
// imported once so every effect shares the same module instance.
let biometricsModule:
  | Promise<typeof import("@/services/biometrics")>
  | undefined;
const loadBiometrics = () =>
  (biometricsModule ??= import("@/services/biometrics"));

/**
 * Biometric app lock for the native app. While the session is signed in and
 * the lock is on, the app starts locked and locks again after it has been in
 * the background for LOCK_AFTER_BACKGROUND_MS.
 */
export function useAppLock(isSignedIn: boolean) {
  const isNative = Capacitor.isNativePlatform();
  // Native starts "checking" so signed-in content never paints before the
  // setting has been read.
  const [state, setState] = useState<LockState>(
    isNative ? "checking" : "unlocked",
  );
  const isPrompting = useRef(false);
  const [label, setBiometricLabel] = useState("face or fingerprint");

  // Signing out clears the setting, so the next sign-in reads it afresh.
  const [wasSignedIn, setWasSignedIn] = useState(isSignedIn);
  if (wasSignedIn !== isSignedIn) {
    setWasSignedIn(isSignedIn);
    if (isNative && !isSignedIn) setState("checking");
  }

  const unlock = useCallback(async () => {
    if (isPrompting.current) return;
    isPrompting.current = true;
    try {
      const { verifyBiometricIdentity } = await loadBiometrics();
      if (await verifyBiometricIdentity(UNLOCK_REASON)) {
        setState("unlocked");
      }
    } finally {
      isPrompting.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isNative) return;
    void loadBiometrics().then(({ removeLegacyBiometricCredentials }) =>
      removeLegacyBiometricCredentials(),
    );
  }, [isNative]);

  useEffect(() => {
    if (!isNative || !isSignedIn || state !== "checking") return;
    let cancelled = false;
    void loadBiometrics()
      .then(async (biometrics) => {
        const [enabled, availability] = await Promise.all([
          biometrics.isAppLockEnabled(),
          biometrics.checkBiometricAvailability(),
        ]);
        if (cancelled) return;
        setBiometricLabel(biometricLabel(availability.biometryType));
        setState(enabled ? "locked" : "unlocked");
      })
      // Fail closed: the lock screen still offers both ways back in.
      .catch(() => {
        if (!cancelled) setState("locked");
      });

    return () => {
      cancelled = true;
    };
  }, [isNative, isSignedIn, state]);

  useEffect(() => {
    if (!isNative || !isSignedIn) return;
    let backgroundedAt: number | null = null;
    let removeListener: (() => void) | undefined;
    let disposed = false;

    void import("@capacitor/app").then(async ({ App }) => {
      const handle = await App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive) {
          backgroundedAt = Date.now();

          return;
        }
        const awayFor =
          backgroundedAt === null ? 0 : Date.now() - backgroundedAt;
        backgroundedAt = null;
        // Covers the app at once, then re-reads the setting like a cold start.
        if (awayFor >= LOCK_AFTER_BACKGROUND_MS) setState("checking");
      });
      if (disposed) {
        void handle.remove();
      } else {
        removeListener = () => void handle.remove();
      }
    });

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [isNative, isSignedIn]);

  // Prompt straight away rather than making the user tap Unlock first.
  useEffect(() => {
    if (state === "locked") void unlock();
  }, [state, unlock]);

  return {
    isLocked: isSignedIn && state !== "unlocked",
    isChecking: state === "checking",
    biometricLabel: label,
    unlock,
  };
}
