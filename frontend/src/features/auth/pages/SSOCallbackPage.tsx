import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { apiService } from "@/utils/apiServices";

/**
 * SSOCallbackPage - Handles the callback from Clerk OAuth providers
 * 
 * This page is shown after the user authenticates with Google/Facebook/Apple.
 * 
 * Important: The Clerk user account is already created at this point (OAuth flow).
 * However, we DON'T create the user in our database yet - that happens only
 * after they complete the profile setup form.
 * 
 * Flow:
 * 1. User clicks "Sign up with Google" → Clerk creates account, redirects here
 * 2. We extract profile data and store it temporarily
 * 3. Redirect to profile setup
 * 4. User completes profile → THEN we create the user in our DB
 */
export default function SSOCallbackPage() {
  const { user, session } = useClerk();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Wait for session to be ready
        if (!session || !user) {
          return;
        }

        // Get the Clerk session token
        const token = await session.getToken();
        
        if (!token) {
          setError("Failed to get authentication token");
          setIsProcessing(false);
          return;
        }

        // Set the token for API calls
        apiService.setAuthToken(token);

        // NOTE: We DON'T sync the user to our backend here.
        // The user in our DB will only be created after profile setup is complete.
        // This allows users to back out without creating incomplete accounts.

        // Extract social login data for pre-population
        const socialData = {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          // Some providers may include birthday in unsafeMetadata
          dateOfBirth: (user.unsafeMetadata?.dateOfBirth as string) || "",
        };

        // Store social data temporarily for profile setup
        sessionStorage.setItem("socialProfileData", JSON.stringify(socialData));

        // Redirect to auth-ready - AuthReadyPage will set token and then redirect to home
        navigate({ to: "/auth-ready", search: { redirectTo: "/home" } });
      } catch (error_) {
        console.error("SSO callback error:", error_);
        setError(
          error_ instanceof Error
            ? error_.message
            : "Failed to complete sign-in. Please try again."
        );
        setIsProcessing(false);
      }
    }

    handleCallback();
  }, [session, user, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface-2 p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">
            Sign-in Failed
          </h1>
          <p className="mb-6 text-muted">{error}</p>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-foreground">
          Completing sign-in...
        </h1>
        <p className="mt-2 text-muted">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
}
