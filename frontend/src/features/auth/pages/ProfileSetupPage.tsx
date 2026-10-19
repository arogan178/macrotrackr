import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { Navigate, useSearch } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { isClerkAuthMode } from "@/config/runtime";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { ProfileCreationForm } from "@/features/auth/components/ProfileCreationForm";
import {
  normalizeAuthRedirect,
  resolveProfileCompletion,
} from "@/features/auth/utils/redirect";
import { useUser } from "@/hooks/auth/useAuthQueries";

/**
 * ProfileSetupPage - Post-authentication profile creation
 * Shown after user signs up or signs in for the first time
 * Collects additional profile information (DOB, height, weight, activity level)
 */
export default function ProfileSetupPage() {
  if (!isClerkAuthMode) {
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} />;
  }

  return <ClerkProfileSetupPage />;
}

function ClerkProfileSetupPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const search = (useSearch({ strict: false }) ?? {}) as {
    redirectTo?: string;
  };
  const { data: user, isLoading: isUserLoading } = useUser({
    enabled: isLoaded && isSignedIn,
  });
  const normalizedRedirect = normalizeAuthRedirect(search.redirectTo);
  // Decided once: finishing the form completes the profile, and the form picks
  // the destination, so this guard must not redirect over it.
  const [arrivedComplete, setArrivedComplete] = useState<boolean | null>(null);
  if (isLoaded && isSignedIn && !isUserLoading && arrivedComplete === null) {
    setArrivedComplete(resolveProfileCompletion(user) === true);
  }

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
  if (arrivedComplete) {
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} />;
  }

  return (
    <AuthPageShell
      eyebrow="Profile Setup"
      title="Finish your setup"
      description="Three short steps to set your calorie baseline and daily target."
      panelClassName="max-w-lg"
    >
      <ProfileCreationForm />
    </AuthPageShell>
  );
}
