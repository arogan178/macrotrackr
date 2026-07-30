import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import {
  BiometryType,
  NativeBiometric,
} from "@capgo/capacitor-native-biometric";

import { logger } from "@/lib/logger";

const BIOMETRIC_SERVER_ID = "com.macrotrackr.app";
const BIOMETRIC_STORED_KEY = "has_biometric_credentials";

export interface BiometricAvailability {
  isAvailable: boolean;
  hasStoredCredentials: boolean;
  biometryType: "Face ID" | "Touch ID" | "Fingerprint" | "Biometrics" | "None";
  reason?: string;
}

export interface StoredBiometricCredentials {
  username: string;
  password?: string;
}

/**
 * Checks if biometric hardware (Face ID, Touch ID, Android Fingerprint) is supported and enrolled.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!Capacitor.isNativePlatform()) {
    return {
      isAvailable: false,
      hasStoredCredentials: false,
      biometryType: "None",
      reason: "Biometrics not supported in browser mode",
    };
  }

  try {
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) {
      return {
        isAvailable: false,
        hasStoredCredentials: false,
        biometryType: "None",
        reason: "Biometric authentication not set up or disabled",
      };
    }

    const flag = await Preferences.get({ key: BIOMETRIC_STORED_KEY });
    const hasStoredCredentials = flag.value === "true";

    let biometryType: BiometricAvailability["biometryType"] = "Biometrics";
    switch (result.biometryType) {
      case BiometryType.FACE_ID:
        biometryType = "Face ID";
        break;
      case BiometryType.TOUCH_ID:
        biometryType = "Touch ID";
        break;
      case BiometryType.FINGERPRINT:
        biometryType = "Fingerprint";
        break;
      case BiometryType.MULTIPLE:
        biometryType = "Biometrics";
        break;
      default:
        biometryType = "Biometrics";
        break;
    }

    return {
      isAvailable: true,
      hasStoredCredentials,
      biometryType,
    };
  } catch (error) {
    logger.error("Failed to check biometric availability:", error);

    return {
      isAvailable: false,
      hasStoredCredentials: false,
      biometryType: "None",
      reason:
        error instanceof Error ? error.message : "Failed to query biometrics",
    };
  }
}

/**
 * Saves login credentials / session secret securely in native Keychain / KeyStore.
 */
export async function saveBiometricCredentials(
  username: string,
  secretToken: string,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await NativeBiometric.setCredentials({
      username,
      password: secretToken,
      server: BIOMETRIC_SERVER_ID,
    });
    await Preferences.set({ key: BIOMETRIC_STORED_KEY, value: "true" });
    logger.info("Saved biometric credentials securely to KeyStore/Keychain");

    return true;
  } catch (error) {
    logger.error("Failed to save biometric credentials:", error);

    return false;
  }
}

/**
 * Verifies user's Face ID / Touch ID / Fingerprint identity and retrieves saved credentials.
 * Note: NativeBiometric.getCredentials() triggers the biometric prompt natively on Android & iOS.
 */
export async function authenticateWithBiometrics(): Promise<StoredBiometricCredentials | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    // NativeBiometric.getCredentials prompts the OS biometric dialog directly
    const credentials = await NativeBiometric.getCredentials({
      server: BIOMETRIC_SERVER_ID,
    });

    if (!credentials?.username) {
      logger.warn("No stored credentials found in KeyStore/Keychain");

      return null;
    }

    return {
      username: credentials.username,
      password: credentials.password,
    };
  } catch (error) {
    logger.warn("Biometric authentication cancelled or failed:", error);

    return null;
  }
}

/**
 * Deletes saved biometric credentials from native KeyStore / Keychain.
 */
export async function clearBiometricCredentials(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await NativeBiometric.deleteCredentials({
      server: BIOMETRIC_SERVER_ID,
    });
    await Preferences.remove({ key: BIOMETRIC_STORED_KEY });
    logger.info("Cleared biometric credentials from KeyStore/Keychain");

    return true;
  } catch (error) {
    logger.error("Failed to clear biometric credentials:", error);

    return false;
  }
}
