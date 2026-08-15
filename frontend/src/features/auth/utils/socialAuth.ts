export type SocialAuthIntent = "signin" | "signup";

export type SocialAuthAction =
  | "auth-ready"
  | "show-email"
  | "switch-to-signin"
  | "switch-to-signup"
  | null;

export interface SocialAuthResolution {
  message: string;
  action: SocialAuthAction;
  tone: "error" | "warning" | "info";
}

interface ClerkErrorEntry {
  code?: string;
  message?: string;
  longMessage?: string;
}

interface ClerkLikeError {
  code?: string;
  message?: string;
  errors?: ClerkErrorEntry[];
}

function extractClerkError(error: unknown): {
  code?: string;
  message?: string;
} {
  if (!error || typeof error !== "object") {
    return {};
  }

  const clerkError = error as ClerkLikeError;
  const firstError = Array.isArray(clerkError.errors)
    ? clerkError.errors[0]
    : undefined;

  return {
    code: firstError?.code ?? clerkError.code,
    message:
      firstError?.longMessage ?? firstError?.message ?? clerkError.message,
  };
}

export function resolveSocialAuthError(
  error: unknown,
  intent: SocialAuthIntent,
): SocialAuthResolution {
  const { code, message } = extractClerkError(error);
  const intentLabel = intent === "signup" ? "sign-up" : "sign-in";
  const fallbackMessage =
    intent === "signup"
      ? "Social sign-up failed. Please try again."
      : "Social sign-in failed. Please try again.";

  const normalized = `${code ?? ""} ${message ?? ""}`.toLowerCase();

  if (
    code === "authorization_invalid" ||
    normalized.includes("authorization_invalid") ||
    normalized.includes("unauthorized request") ||
    normalized.includes("not authorized")
  ) {
    return {
      message: "Your session has expired or is invalid. Please sign in again.",
      action: "switch-to-signin",
      tone: "warning",
    };
  }

  if (
    code === "session_exists" ||
    normalized.includes("session exists") ||
    normalized.includes("already have an active session")
  ) {
    return {
      message: "You're already signed in. Redirecting you now.",
      action: "auth-ready",
      tone: "info",
    };
  }

  if (
    code === "form_identifier_exists" ||
    code === "identifier_already_signed_up" ||
    normalized.includes("already signed up") ||
    normalized.includes("already exists")
  ) {
    return {
      message:
        intent === "signup"
          ? "That account already exists. Redirecting you to sign in instead."
          : "That account already exists. Continue signing in or use email if you set a password.",
      action: intent === "signup" ? "switch-to-signin" : "show-email",
      tone: "info",
    };
  }

  // Clerk's account-linking failures surface to the user as "we are unable to
  // link that account", which is meaningless to someone who has never had an
  // account to link. It means one of two things — the provider's email is not
  // verified, or the instance is not accepting this sign-up — and neither is
  // something the reader can act on from that sentence.
  if (
    code === "external_account_not_found" ||
    code === "external_account_exists" ||
    code === "identification_claimed" ||
    normalized.includes("unable to link") ||
    normalized.includes("external account")
  ) {
    return {
      message:
        intent === "signup"
          ? "We couldn't finish signing you up with that provider. Create an account with your email instead — you can connect the provider afterwards from Settings."
          : "That provider isn't connected to an account yet. Sign up first, or use the email you registered with.",
      action: "show-email",
      tone: "warning",
    };
  }

  if (
    code === "oauth_access_denied" ||
    normalized.includes("access denied") ||
    normalized.includes("access blocked") ||
    normalized.includes("cancelled") ||
    normalized.includes("canceled")
  ) {
    return {
      message:
        `Social ${intentLabel} was cancelled or blocked. Please try again or continue with email.`,
      action: "show-email",
      tone: "warning",
    };
  }

  if (
    normalized.includes("client_id") ||
    normalized.includes("invalid_request") ||
    normalized.includes("strategy") ||
    normalized.includes("oauth")
  ) {
    return {
      message:
        `Social ${intentLabel} is temporarily unavailable. Please continue with email while we sort out the provider configuration.`,
      action: "show-email",
      tone: "error",
    };
  }

  return {
    message: message ?? fallbackMessage,
    action: null,
    tone: "error",
  };
}