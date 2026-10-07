import { Navigate, useMatch } from "@tanstack/react-router";

import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { isClerkAuthMode } from "@/config/runtime";
import {
  buildRedirectFromLocation,
  resolveProfileCompletion,
} from "@/features/auth/utils/redirect";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useAppAuthState } from "@/hooks/auth/useAuthState";

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

export function RequireCompleteProfile({
  children,
}: RequireCompleteProfileProps) {
  // The guarded route, not the router location: once the redirect starts, that
  // is already /profile-setup, and redirecting from it nests redirectTo forever.
  const redirectTo = useMatch({
    strict: false,
    select: buildRedirectFromLocation,
  });
  const { isLoaded: isAuthLoaded, isSignedIn } = useAppAuthState();
  const shouldCheckProfileCompletion = isClerkAuthMode;
  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
    isFetchedAfterMount: isUserFetchedAfterMount,
  } = useUser({
    enabled: shouldCheckProfileCompletion && isAuthLoaded && isSignedIn,
  });

  // Auth state is the one that can hang forever without a network.
  if (!isAuthLoaded) {
    return <AuthLoadingScreen />;
  }

  if (isUserLoading) {
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

  // Local auth mode does not use the Clerk onboarding/profile-setup flow.
  if (!shouldCheckProfileCompletion) {
    return children;
  }

  // If user is null, Clerk says we're signed in but backend auth isn't ready yet
  // (usually token sync race). Route through auth-ready to establish session
  // and sync backend user before trying protected pages again.
  if (user === null) {
    return <Navigate to="/auth-ready" search={{ redirectTo }} replace />;
  }

  const isProfileComplete = resolveProfileCompletion(user);
  // A persisted copy can predate setup finished on another device, so a
  // refetch in flight decides. Offline there is none and the copy stands.
  const isAwaitingFreshProfile =
    isProfileComplete === false && isUserFetching && !isUserFetchedAfterMount;

  // If query has not produced data yet (undefined), avoid crashing/looping.
  if (!user || isAwaitingFreshProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only redirect when we can explicitly determine the profile is incomplete.
  if (isProfileComplete === false) {
    return (
      <Navigate
        to="/profile-setup"
        search={{ redirectTo }}
      />
    );
  }

  // Profile is complete, render the protected content
  return children;
}

export default RequireCompleteProfile;
