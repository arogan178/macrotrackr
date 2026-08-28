/**
 * The Clerk instance has legal consent enabled, which makes `legal_accepted` a
 * required sign-up field. A custom sign-up form has to send it itself.
 *
 * Getting this wrong is invisible until the last step: `signUp.create()` still
 * succeeds (the instance runs progressive sign-up), the email code still sends,
 * and the code still verifies — but the attempt stays at `missing_requirements`
 * because consent is outstanding. The form read that as a failed verification
 * and told the user their code was wrong.
 */

const CONSENT_KEY = "macrotrackr.signup.legalAccepted";

export const LEGAL_ACCEPTED_FIELD = "legal_accepted";

export function rememberLegalConsent(): void {
  try {
    globalThis.sessionStorage?.setItem(CONSENT_KEY, "true");
  } catch {
    // Storage can be unavailable (private mode, embedded webviews). The OAuth
    // repair in SsoCallbackPage degrades to asking the user to sign up again.
  }
}

export function hasRememberedLegalConsent(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

export function forgetLegalConsent(): void {
  try {
    globalThis.sessionStorage?.removeItem(CONSENT_KEY);
  } catch {
    // See rememberLegalConsent.
  }
}

interface LegalConsentSignUp {
  status: string | null;
  // Read defensively: this runs on the OAuth return path, where a throw would
  // put the callback page back to spinning with nothing on screen.
  missingFields?: readonly string[];
}

/**
 * True when the only thing standing between this attempt and an account is the
 * consent flag — the OAuth redirect paths cannot pass it up front, so it has to
 * be repaired on the way back.
 */
export function isMissingLegalConsent(
  signUp: LegalConsentSignUp | null | undefined,
): boolean {
  return (
    signUp?.status === "missing_requirements" &&
    (signUp.missingFields ?? []).includes(LEGAL_ACCEPTED_FIELD)
  );
}
