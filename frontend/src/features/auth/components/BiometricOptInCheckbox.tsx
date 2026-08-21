import { Capacitor } from "@capacitor/core";

interface BiometricOptInCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Storing the password for biometric replay is opt-in only — never save it
 * just because the user signed in.
 */
export function BiometricOptInCheckbox({
  checked,
  onChange,
}: BiometricOptInCheckboxProps) {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <label className="flex min-h-11 items-center gap-3 text-sm text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border accent-primary"
        name="enable-biometric-sign-in"
      />
      Enable biometric sign-in
    </label>
  );
}
