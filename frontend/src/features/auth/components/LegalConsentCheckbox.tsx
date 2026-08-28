import { useId } from "react";

import { LegalLink } from "@/features/auth/components/LegalLink";
import { cn } from "@/lib/classnameUtilities";

interface LegalConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /**
   * Says why the buttons below are inert. A disabled control cannot explain
   * itself: it swallows the click without firing anything.
   */
  showRequiredHint?: boolean;
}

/**
 * Consent is a required sign-up field on the Clerk instance, so the account
 * cannot be created without it. It sits above the actions it gates.
 */
export function LegalConsentCheckbox({
  checked,
  onChange,
  showRequiredHint = false,
}: LegalConsentCheckboxProps) {
  const hintId = useId();

  return (
    <div>
      <label className="flex min-h-11 items-start gap-3 py-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          name="legalAccepted"
          required
          aria-describedby={showRequiredHint ? hintId : undefined}
        />
        <span>
          I agree to the <LegalLink to="/terms">Terms of Service</LegalLink> and{" "}
          <LegalLink to="/privacy">Privacy Policy</LegalLink>.
        </span>
      </label>
      {/*
        Held in place rather than unmounted: dropping it on tick pulls the
        buttons up under the pointer. `invisible` keeps the row's height and
        takes it out of the accessibility tree at the same time.
        pl-7 clears the box and its gap so the hint lines up with the label.
      */}
      <p
        id={hintId}
        className={cn(
          "pl-7 text-xs text-muted",
          !showRequiredHint && "invisible",
        )}
      >
        Accept these to continue.
      </p>
    </div>
  );
}
