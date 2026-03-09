import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { buildRedirectFromLocation } from "@/features/auth/utils/redirect";
import { useUser } from "@/hooks/auth/useAuthQueries";

/**
 * RequireCompleteProfile - Guard component that checks if user has completed their profile
 *
 * This component wraps protected routes and ensures users with incomplete profiles
 * are redirected to the profile setup page. This handles the post-signup flow where
 * Clerk is fully loaded but the user hasn't completed their profile yet.
 *
 * Usage:
 * ```tsx
 * <RequireCompleteProfile>
 *   <HomePage />
 * </RequireCompleteProfile>
 * ```
 */
interface RequireCompleteProfileProps {
  children: React.ReactNode;
}

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

export function RequireCompleteProfile({
  children,
}: RequireCompleteProfileProps) {
  const location = useLocation();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { data: user, isLoading: isUserLoading } = useUser();

  // Show loading while auth state is being determined
  if (!isAuthLoaded || isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not signed in, RequireAuth should handle this, but double-check
  if (!isSignedIn) {
    return <Navigate to="/login" search={{ returnTo: undefined }} />;
  }

  // If user is null, Clerk says we're signed in but backend auth isn't ready yet
  // (usually token sync race). Route through auth-ready to establish session
  // and sync backend user before trying protected pages again.
  if (user === null) {
    const redirectTo = buildRedirectFromLocation(location);
    return <Navigate to="/auth-ready" search={{ redirectTo }} />;
  }

  // If query has not produced data yet (undefined), avoid crashing/looping.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only redirect when we can explicitly determine the profile is incomplete.
  const isProfileComplete = resolveProfileCompletion(user);
  if (isProfileComplete === false) {
    return (
      <Navigate
        to="/profile-setup"
        search={{ redirectTo: buildRedirectFromLocation(location) }}
      />
    );
  }

  // Profile is complete, render the protected content
  return <>{children}</>;
}

export default RequireCompleteProfile;
