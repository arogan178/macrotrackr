import { useSearch } from "@tanstack/react-router";

import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { ClerkSignInForm } from "@/features/auth/components/ClerkSignInForm";

const handleSwitchToSignUp = (returnTo?: string) => {
  const url = returnTo
    ? `/register?returnTo=${encodeURIComponent(returnTo)}`
    : "/register";
  globalThis.location.href = url;
};

const handleForgotPassword = (returnTo?: string) => {
  const url = returnTo
    ? `/reset-password?returnTo=${encodeURIComponent(returnTo)}`
    : "/reset-password";
  globalThis.location.href = url;
};

/**
 * SignInPage - Clerk-powered sign-in page with custom UI
 * Supports email/password and social providers (Google, Facebook, Apple)
 */
export default function SignInPage() {
  const search = useSearch({ from: "/login" });
  const returnTo = search.returnTo as string | undefined;

  return (
    <QueryErrorBoundary>
      <AuthPageShell
        eyebrow="Account Access"
        title="Welcome back"
        description="Sign in to pick up your tracking, saved meals, and goals right where you left them."
      >
        <ClerkSignInForm
          onSwitchToSignUp={() => handleSwitchToSignUp(returnTo)}
          onForgotPassword={() => handleForgotPassword(returnTo)}
          redirectTo={returnTo}
        />
      </AuthPageShell>
    </QueryErrorBoundary>
  );
}
