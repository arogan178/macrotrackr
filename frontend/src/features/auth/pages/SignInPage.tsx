import { useNavigate, useSearch } from "@tanstack/react-router";

import { QueryErrorBoundary } from "@/components/errors/QueryErrorBoundary";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { ClerkSignInForm } from "@/features/auth/components/ClerkSignInForm";
import { resolveAuthReturnTo } from "@/features/auth/utils/redirect";

/**
 * SignInPage - Clerk-powered sign-in page with custom UI
 * Supports email/password and social providers (Google, Facebook, Apple)
 */
export default function SignInPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const returnTo = search.returnTo as string | undefined;
  const returnToSearch = { returnTo: resolveAuthReturnTo(returnTo) };

  return (
    <QueryErrorBoundary>
      <AuthPageShell
        eyebrow="Account Access"
        title="Welcome back"
        description="Sign in to pick up your tracking, saved meals, and goals right where you left them."
      >
        <ClerkSignInForm
          onSwitchToSignUp={() =>
            navigate({ to: "/register", search: returnToSearch })
          }
          onForgotPassword={() =>
            navigate({ to: "/reset-password", search: returnToSearch })
          }
          redirectTo={returnTo}
        />
      </AuthPageShell>
    </QueryErrorBoundary>
  );
}
