import { LegalLink } from "@/features/auth/components/LegalLink";

interface LegalConsentNoticeProps {
  /** Context sentence placed before the agreement, where the flow needs one. */
  lead?: string;
}

/**
 * Consent for one-click provider sign-in, where a checkbox would be friction
 * on a button that is itself the whole interaction. Pressing the button is the
 * agreement, so the terms have to be visible beside it: sending the flag
 * without showing them records consent to something never presented.
 */
export function LegalConsentNotice({ lead }: LegalConsentNoticeProps) {
  return (
    <p className="mt-4 text-center text-xs text-muted">
      {lead ? `${lead} ` : null}
      By continuing you agree to our{" "}
      <LegalLink to="/terms">Terms of Service</LegalLink> and{" "}
      <LegalLink to="/privacy">Privacy Policy</LegalLink>.
    </p>
  );
}
