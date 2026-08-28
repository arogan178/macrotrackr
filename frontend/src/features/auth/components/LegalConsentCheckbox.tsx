import { LegalLink } from "@/features/auth/components/LegalLink";

interface LegalConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Consent is a required sign-up field on the Clerk instance, so the account
 * cannot be created without it.
 */
export function LegalConsentCheckbox({
  checked,
  onChange,
}: LegalConsentCheckboxProps) {
  return (
    <label className="flex min-h-11 items-start gap-3 py-2 text-sm text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
        name="legalAccepted"
        required
      />
      <span>
        I agree to the <LegalLink to="/terms">Terms of Service</LegalLink> and{" "}
        <LegalLink to="/privacy">Privacy Policy</LegalLink>.
      </span>
    </label>
  );
}
