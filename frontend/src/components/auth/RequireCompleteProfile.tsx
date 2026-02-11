import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
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

export function RequireCompleteProfile({ children }: RequireCompleteProfileProps) {
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
    return <Navigate to="/login" search={{}} />;
  }

  // If user data is loaded but profile is incomplete, redirect to setup
  // Also handle case where user is undefined (auth error or user not synced yet)
  if (!user || !user.isProfileComplete) {
    return <Navigate to="/profile-setup" />;
  }

  // Profile is complete, render the protected content
  return <>{children}</>;
}

export default RequireCompleteProfile;
