import { useSearch } from "@tanstack/react-router";

import { QueryErrorBoundary } from "@/components/errors/QueryErrorBoundary";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { ClerkSignUpForm } from "@/features/auth/components/ClerkSignUpForm";

const handleSwitchToSignIn = (returnTo?: string) => {
  const url = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";
  globalThis.location.href = url;
};

/**
 * SignUpPage - Clerk-powered sign-up page with custom UI
 * Supports email/password with verification and social providers (Google, Facebook, Apple)
 */
export default function SignUpPage() {
  const search = useSearch({ from: "/register" });
  const returnTo = search.returnTo as string | undefined;

  return (
    <QueryErrorBoundary>
      <AuthPageShell
        eyebrow="New Account"
        title="Create your account"
        description="Set up your MacroTrackr account and start building your meals, history, and goals."
      >
        <ClerkSignUpForm
          onSwitchToSignIn={() => handleSwitchToSignIn(returnTo)}
          redirectTo={returnTo}
        />
      </AuthPageShell>
    </QueryErrorBoundary>
  );
}
