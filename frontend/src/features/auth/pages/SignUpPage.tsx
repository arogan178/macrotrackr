import { useNavigate, useSearch } from "@tanstack/react-router";

import { QueryErrorBoundary } from "@/components/errors/QueryErrorBoundary";
import { isClerkAuthMode, isLocalAuthMode } from "@/config/runtime";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { ClerkSignUpForm } from "@/features/auth/components/ClerkSignUpForm";
import { LocalSignUpForm } from "@/features/auth/components/LocalSignUpForm";
import { resolveAuthReturnTo } from "@/features/auth/utils/redirect";

/**
 * SignUpPage - Clerk-powered sign-up page with custom UI
 * Supports email/password with verification and social providers (Google, Facebook, Apple)
 */
export default function SignUpPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" });
  const returnTo = search.returnTo as string | undefined;
  const returnToSearch = { returnTo: resolveAuthReturnTo(returnTo) };

  return (
    <QueryErrorBoundary>
      <AuthPageShell
        eyebrow="New Account"
        title="Create your account"
        description="Set up your MacroTrackr account and start building your meals, history, and goals."
        showBackToHome={!isLocalAuthMode}
      >
        {isClerkAuthMode ? (
          <ClerkSignUpForm
            onSwitchToSignIn={() =>
              navigate({ to: "/login", search: returnToSearch })
            }
            redirectTo={returnTo}
          />
        ) : (
          <LocalSignUpForm
            onSwitchToSignIn={() =>
              navigate({ to: "/login", search: returnToSearch })
            }
            redirectTo={returnTo}
          />
        )}
      </AuthPageShell>
    </QueryErrorBoundary>
  );
}
