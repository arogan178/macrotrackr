import { Link, useSearch } from "@tanstack/react-router";

import CardContainer from "@/components/form/CardContainer";
import LogoButton from "@/components/layout/LogoButton";
import PageBackground from "@/components/layout/PageBackground";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import { ClerkSignInForm } from "@/features/auth/components/ClerkSignInForm";

const handleSwitchToSignUp = (returnTo?: string) => {
  const url = returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register";
  globalThis.location.href = url;
};

const handleForgotPassword = (returnTo?: string) => {
  const url = returnTo ? `/reset-password?returnTo=${encodeURIComponent(returnTo)}` : "/reset-password";
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
      <div className="relative flex min-h-screen flex-col overflow-hidden text-foreground">
        <PageBackground />
        <header className="z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <Link to="/" className="flex items-center" aria-label="Home">
                <LogoButton className="h-0" />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <section className="flex w-full flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <CardContainer className="bg-surface-2/90 p-8 shadow-lg ring-1 ring-border/40 backdrop-blur-xl">
                <ClerkSignInForm
                  onSwitchToSignUp={() => handleSwitchToSignUp(returnTo)}
                  onForgotPassword={() => handleForgotPassword(returnTo)}
                  redirectTo={returnTo}
                />
              </CardContainer>
            </div>
          </section>
        </main>
      </div>
    </QueryErrorBoundary>
  );
}
