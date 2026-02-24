import { useAuth } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "@tanstack/react-router";

import CardContainer from "@/components/form/CardContainer";
import LogoButton from "@/components/layout/LogoButton";
import PageBackground from "@/components/layout/PageBackground";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ProfileCreationForm } from "@/features/auth/components/ProfileCreationForm";
import { useUser } from "@/hooks/auth/useAuthQueries";

function resolveProfileCompletion(user: unknown): boolean | undefined {
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const userRecord = user as Record<string, unknown>;

  if (typeof userRecord.isProfileComplete === "boolean") {
    return userRecord.isProfileComplete;
  }

  if ("dateOfBirth" in userRecord) {
    return Boolean(userRecord.dateOfBirth);
  }

  return undefined;
}

/**
 * ProfileSetupPage - Post-authentication profile creation
 * Shown after user signs up or signs in for the first time
 * Collects additional profile information (DOB, height, weight, activity level)
 */
export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { data: user, isLoading: isUserLoading } = useUser({
    enabled: isLoaded && isSignedIn,
  });

  // Show loading while Clerk loads
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/login" search={{ returnTo: undefined }} />;
  }

  // Redirect users who already completed onboarding.
  if (!isUserLoading && resolveProfileCompletion(user) === true) {
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} />;
  }

  return (
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
              <ProfileCreationForm />
            </CardContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
