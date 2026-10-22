import type { BiometricAvailability } from "@/services/biometrics";

/** How to name the biometric in copy: "Sign in with fingerprint". */
export function biometricLabel(
  type: BiometricAvailability["biometryType"],
): string {
  switch (type) {
    case "Face ID":
    case "Touch ID":
      return type;
    case "Fingerprint":
      return "fingerprint";
    default:
      return "face or fingerprint";
  }
}
