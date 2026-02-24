import { useNavigate } from "@tanstack/react-router";

import CardContainer from "@/components/form/CardContainer";
import LogoButton from "@/components/layout/LogoButton";
import PageBackground from "@/components/layout/PageBackground";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  const navigate = useNavigate();

  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <div className="relative flex min-h-screen flex-col overflow-hidden text-foreground">
          <PageBackground />
          <header className="fixed top-0 right-0 left-0 z-50 bg-background/80 backdrop-blur-md">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-14 items-center justify-between">
                <LogoButton
                  className="!h-auto !p-0"
                  onClick={() => navigate({ to: "/" })}
                  ariaLabel="Home"
                />
              </div>
            </div>
          </header>

          <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 pt-28 sm:px-6 lg:px-8">
            <section className="flex w-full flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <CardContainer className="bg-surface p-8">
                  <ResetPasswordForm />
                </CardContainer>
              </div>
            </section>
          </main>
        </div>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

export default ResetPasswordPage;
