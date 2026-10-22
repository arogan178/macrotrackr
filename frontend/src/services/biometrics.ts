import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import {
  BiometryType,
  NativeBiometric,
} from "@capgo/capacitor-native-biometric";

import { logger } from "@/lib/logger";

const APP_LOCK_KEY = "app_lock_enabled";

// Earlier builds saved the account password for a sign-in button.
const LEGACY_SERVER_ID = "com.macrotrackr.app";
const LEGACY_STORED_KEY = "has_biometric_credentials";

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: "Face ID" | "Touch ID" | "Fingerprint" | "Biometrics" | "None";
}

const UNAVAILABLE: BiometricAvailability = {
  isAvailable: false,
  biometryType: "None",
};

/**
 * Checks if biometric hardware (Face ID, Touch ID, Android Fingerprint) is supported and enrolled.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!Capacitor.isNativePlatform()) {
    return UNAVAILABLE;
  }

  try {
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) {
      return UNAVAILABLE;
    }

    switch (result.biometryType) {
      case BiometryType.FACE_ID:
        return { isAvailable: true, biometryType: "Face ID" };
      case BiometryType.TOUCH_ID:
        return { isAvailable: true, biometryType: "Touch ID" };
      case BiometryType.FINGERPRINT:
        return { isAvailable: true, biometryType: "Fingerprint" };
      default:
        return { isAvailable: true, biometryType: "Biometrics" };
    }
  } catch (error) {
    logger.error("Failed to check biometric availability:", error);

    return UNAVAILABLE;
  }
}

/**
 * Shows the system biometric prompt, with the device PIN as a fallback.
 * Resolves false when the user cancels or the check fails.
 */
export async function verifyBiometricIdentity(
  reason: string,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await NativeBiometric.verifyIdentity({
      reason,
      title: "Unlock MacroTrackr",
      useFallback: true,
    });

    return true;
  } catch (error) {
    logger.warn("Biometric verification cancelled or failed:", error);

    return false;
  }
}

export async function isAppLockEnabled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  const { value } = await Preferences.get({ key: APP_LOCK_KEY });

  return value === "true";
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  await (enabled
    ? Preferences.set({ key: APP_LOCK_KEY, value: "true" })
    : Preferences.remove({ key: APP_LOCK_KEY }));
}

/**
 * Deletes a password saved by an earlier build, so none outlives the update.
 */
export async function removeLegacyBiometricCredentials(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const { value } = await Preferences.get({ key: LEGACY_STORED_KEY });
  if (value !== "true") {
    return;
  }

  try {
    await NativeBiometric.deleteCredentials({ server: LEGACY_SERVER_ID });
    await Preferences.remove({ key: LEGACY_STORED_KEY });
  } catch (error) {
    logger.error("Failed to delete legacy biometric credentials:", error);
  }
}

/**
 * Turns the app lock off and removes any legacy password. Runs on sign-out so
 * the next account on this device starts unlocked.
 */
export async function clearAppLock(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  await setAppLockEnabled(false);
  await removeLegacyBiometricCredentials();
}
