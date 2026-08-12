/**
 * Helpers for the second-factor challenge shown during sign-in.
 *
 * Two different sign-in statuses land here:
 * - `needs_client_trust` — Device Trust. The account has no MFA, but the user
 *   is signing in from an unrecognised device, so Clerk wants an email or SMS
 *   code before completing.
 * - `needs_second_factor` — the account has MFA enabled. MFA takes precedence
 *   over Device Trust, so only one of the two statuses can occur per attempt.
 *
 * Both are answered with the same `prepareSecondFactor` / `attemptSecondFactor`
 * pair, which is why one component serves both.
 */

export const SECOND_FACTOR_STRATEGIES = [
  "totp",
  "phone_code",
  "email_code",
  "backup_code",
] as const;

export type SecondFactorStrategy = (typeof SECOND_FACTOR_STRATEGIES)[number];

export interface SecondFactorOption {
  strategy: SecondFactorStrategy;
  /** Present on email_code factors; identifies which address to send to. */
  emailAddressId?: string;
  /** Present on phone_code factors; identifies which number to send to. */
  phoneNumberId?: string;
  /** Redacted identifier Clerk exposes for display, e.g. "j****@example.com". */
  safeIdentifier?: string;
}

/**
 * Order we fall back through when the user has more than one factor available.
 * TOTP first because it needs no delivery round trip and cannot be intercepted
 * in transit; backup codes last because they are consumed when used.
 */
const STRATEGY_PREFERENCE: readonly SecondFactorStrategy[] = [
  "totp",
  "phone_code",
  "email_code",
  "backup_code",
];

function isSecondFactorStrategy(value: unknown): value is SecondFactorStrategy {
  return (
    typeof value === "string" &&
    (SECOND_FACTOR_STRATEGIES as readonly string[]).includes(value)
  );
}

function readOptionalString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Normalise Clerk's `supportedSecondFactors` into the subset we can actually
 * present. Unknown strategies are dropped rather than rendered as a dead end.
 */
export function parseSecondFactors(
  factors: ReadonlyArray<unknown> | null | undefined,
): SecondFactorOption[] {
  if (!factors) {
    return [];
  }

  const parsed: SecondFactorOption[] = [];
  const seen = new Set<SecondFactorStrategy>();

  for (const factor of factors) {
    if (typeof factor !== "object" || factor === null) {
      continue;
    }

    const record = factor as Record<string, unknown>;
    if (!isSecondFactorStrategy(record.strategy)) {
      continue;
    }

    if (seen.has(record.strategy)) {
      continue;
    }
    seen.add(record.strategy);

    parsed.push({
      strategy: record.strategy,
      emailAddressId: readOptionalString(record, "emailAddressId"),
      phoneNumberId: readOptionalString(record, "phoneNumberId"),
      safeIdentifier: readOptionalString(record, "safeIdentifier"),
    });
  }

  return parsed;
}

export function selectPreferredSecondFactor(
  options: readonly SecondFactorOption[],
): SecondFactorOption | undefined {
  for (const strategy of STRATEGY_PREFERENCE) {
    const match = options.find((option) => option.strategy === strategy);
    if (match) {
      return match;
    }
  }

  return options[0];
}

/**
 * Whether the strategy needs `prepareSecondFactor` to dispatch a code first.
 * TOTP and backup codes are already in the user's possession.
 */
export function requiresCodeDelivery(strategy: SecondFactorStrategy): boolean {
  return strategy === "email_code" || strategy === "phone_code";
}

export interface SecondFactorCopy {
  title: string;
  description: string;
  inputLabel: string;
  /** Label for the control that re-sends the code, when one applies. */
  resendLabel?: string;
}

export function describeSecondFactor(
  option: SecondFactorOption,
  isDeviceTrust: boolean,
): SecondFactorCopy {
  const target = option.safeIdentifier;

  switch (option.strategy) {
    case "email_code": {
      return {
        title: isDeviceTrust ? "Verify this device" : "Check your email",
        description: target
          ? `We sent a code to ${target}.`
          : "We sent a code to your email address.",
        inputLabel: "Verification code",
        resendLabel: "Resend code",
      };
    }
    case "phone_code": {
      return {
        title: isDeviceTrust ? "Verify this device" : "Check your phone",
        description: target
          ? `We sent a code to ${target}.`
          : "We sent a code to your phone.",
        inputLabel: "Verification code",
        resendLabel: "Resend code",
      };
    }
    case "totp": {
      return {
        title: "Two-factor authentication",
        description: "Enter the code from your authenticator app.",
        inputLabel: "Authenticator code",
      };
    }
    case "backup_code": {
      return {
        title: "Use a backup code",
        description:
          "Enter one of the backup codes you saved when setting up two-factor authentication.",
        inputLabel: "Backup code",
      };
    }
  }
}

export function describeAlternativeStrategy(
  strategy: SecondFactorStrategy,
): string {
  switch (strategy) {
    case "email_code": {
      return "Email me a code";
    }
    case "phone_code": {
      return "Text me a code";
    }
    case "totp": {
      return "Use my authenticator app";
    }
    case "backup_code": {
      return "Use a backup code";
    }
  }
}

/**
 * Backup codes are alphanumeric; every other strategy is a numeric OTP. Drives
 * the input mode so mobile keyboards show the right layout.
 */
export function isNumericCode(strategy: SecondFactorStrategy): boolean {
  return strategy !== "backup_code";
}

/**
 * Build the `prepareSecondFactor` argument. Returns null when the strategy
 * needs no preparation, so callers can skip the request entirely.
 */
export function buildPrepareParams(
  option: SecondFactorOption,
): { strategy: "email_code"; emailAddressId?: string } | { strategy: "phone_code"; phoneNumberId?: string } | null {
  if (option.strategy === "email_code") {
    return option.emailAddressId
      ? { strategy: "email_code", emailAddressId: option.emailAddressId }
      : { strategy: "email_code" };
  }

  if (option.strategy === "phone_code") {
    return option.phoneNumberId
      ? { strategy: "phone_code", phoneNumberId: option.phoneNumberId }
      : { strategy: "phone_code" };
  }

  return null;
}
