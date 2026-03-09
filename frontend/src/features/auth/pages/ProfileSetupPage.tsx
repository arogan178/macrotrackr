import { useAuth } from "@clerk/clerk-react";
import { Navigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { ProfileCreationForm } from "@/features/auth/components/ProfileCreationForm";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
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
  const { isSignedIn, isLoaded } = useAuth();
  const search = useSearch({ from: "/profile-setup" }) as {
    redirectTo?: string;
  };
  const { data: user, isLoading: isUserLoading } = useUser({
    enabled: isLoaded && isSignedIn,
  });
  const normalizedRedirect = normalizeAuthRedirect(search.redirectTo);

  useEffect(() => {
    sessionStorage.setItem("postAuthRedirect", normalizedRedirect);
  }, [normalizedRedirect]);

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
    <AuthPageShell
      eyebrow="Profile Setup"
      title="Finish your setup"
      description="Add a few details so we can personalize targets, calorie estimates, and progress tracking."
      panelClassName="max-w-lg"
    >
      <ProfileCreationForm />
    </AuthPageShell>
  );
}
