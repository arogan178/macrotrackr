import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import {
  BiometryType,
  NativeBiometric,
} from "@capgo/capacitor-native-biometric";

import { logger } from "@/lib/logger";

const APP_LOCK_KEY = "app_lock_enabled";
const APP_LOCK_OFFERED_KEY = "app_lock_offered";

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
 * Shows the system biometric prompt. On iOS it falls back to the passcode
 * itself; Android shows Cancel instead, and the lock screen offers
 * verifyDeviceCredential as a separate step.
 * Resolves false when the user cancels or the check fails.
 */
export async function verifyBiometricIdentity(
  reason: string,
): Promise<boolean> {
  return verify("Biometric verification cancelled or failed:", {
    reason,
    title: "Unlock MacroTrackr",
    useFallback: true,
    allowedBiometryTypes: [
      BiometryType.FINGERPRINT,
      BiometryType.FACE_AUTHENTICATION,
    ],
  });
}

/**
 * Asks for the device PIN, pattern or password on its own. Some Android builds
 * drop the PIN from a combined biometric-or-PIN prompt, so it gets its own.
 */
export async function verifyDeviceCredential(reason: string): Promise<boolean> {
  // A PIN-only prompt needs Android 11; older versions get the combined one.
  const androidVersion = Number(/Android (\d+)/.exec(navigator.userAgent)?.[1]);
  const allowedBiometryTypes =
    androidVersion >= 11
      ? [BiometryType.DEVICE_CREDENTIAL]
      : [BiometryType.FACE_AUTHENTICATION, BiometryType.DEVICE_CREDENTIAL];

  return verify("Device credential verification cancelled or failed:", {
    reason,
    title: "Unlock MacroTrackr",
    allowedBiometryTypes,
  });
}

async function verify(
  failureMessage: string,
  options: Parameters<typeof NativeBiometric.verifyIdentity>[0],
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await NativeBiometric.verifyIdentity(options);

    return true;
  } catch (error) {
    logger.warn(failureMessage, error);

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

/** Whether the post-sign-in offer to turn the lock on has been shown. */
export async function wasAppLockOffered(): Promise<boolean> {
  const { value } = await Preferences.get({ key: APP_LOCK_OFFERED_KEY });

  return value === "true";
}

export async function markAppLockOffered(): Promise<void> {
  await Preferences.set({ key: APP_LOCK_OFFERED_KEY, value: "true" });
}

/**
 * Deletes a password saved by an earlier build, so none outlives the update.
 */
export async function removeLegacyBiometricCredentials(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { isSaved } = await NativeBiometric.isCredentialsSaved({
      server: LEGACY_SERVER_ID,
    });
    if (isSaved) {
      await NativeBiometric.deleteCredentials({ server: LEGACY_SERVER_ID });
    }
    await Preferences.remove({ key: LEGACY_STORED_KEY });
  } catch (error) {
    logger.error("Failed to delete legacy biometric credentials:", error);
  }
}
