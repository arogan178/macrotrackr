import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import {
  AppleIcon,
  CalorieIcon,
  FacebookIcon,
  GoogleIcon,
} from "@/components/ui/Icons";
import { useStore } from "@/store/store";

interface ClerkSignInFormProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export function ClerkSignInForm({
  onSwitchToSignUp,
  onForgotPassword,
}: ClerkSignInFormProps) {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { showNotification } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle social sign-in
  const handleSocialSignIn = async (
    strategy: "oauth_google" | "oauth_facebook" | "oauth_apple",
  ) => {
    if (!isLoaded || !signIn) {
      showNotification("Authentication not ready. Please try again.", "error");
      return;
    }

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/home",
      });
    } catch (error) {
      console.error("Social sign-in error:", error);
      showNotification(
        error instanceof Error ? error.message : "Social sign-in failed",
        "error",
      );
    }
  };

  // Handle email/password sign-in
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signIn) {
      showNotification("Authentication not ready. Please try again.", "error");
      return;
    }

    // Check if there's an existing sign-in state that needs to be cleared
    // This can happen when password was changed in Clerk
    console.log("[ClerkSignInForm] Current sign-in status:", signIn.status);
    
    // If there's a previous sign-in attempt in progress, we should handle it
    if (signIn.status && signIn.status !== "needs_identifier") {
      console.log("[ClerkSignInForm] Existing sign-in state detected, creating fresh attempt");
    }

    console.log("[ClerkSignInForm] Starting sign-in attempt");

    setIsLoading(true);

    try {
      console.log("[ClerkSignInForm] Attempting sign-in with:", { email });
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log("[ClerkSignInForm] Sign-in result:", { 
        status: result.status, 
        hasSessionId: !!result.createdSessionId,
        sessionId: result.createdSessionId,
        userData: result.userData,
        identifier: result.identifier,
        supportedFirstFactors: result.supportedFirstFactors?.map((f: any) => f.strategy),
        supportedSecondFactors: result.supportedSecondFactors?.map((f: any) => f.strategy),
        firstFactorVerification: result.firstFactorVerification,
        secondFactorVerification: result.secondFactorVerification
      });

      if (result.status === "complete") {
        // Sign-in complete, set session and redirect to auth-ready
        // AuthReadyPage will set the token and then redirect to home
        console.log("[ClerkSignInForm] Sign-in complete, setting active session");
        if (!result.createdSessionId) {
          console.error("[ClerkSignInForm] No session ID available despite complete status");
          showNotification("Sign-in completed but session could not be created. Please try again.", "error");
          return;
        }
        await setActive({ session: result.createdSessionId });
        showNotification("Signed in successfully!", "success");
        navigate({ to: "/auth-ready", search: { redirectTo: "/home" } });
      } else if (result.status === "needs_first_factor") {
        // Handle cases like email verification or password reset needed
        console.log("[ClerkSignInForm] Needs first factor, checking requirements...");
        const supportedStrategies = result.supportedFirstFactors?.map((f: any) => f.strategy);
        console.log("[ClerkSignInForm] Supported strategies:", supportedStrategies);
        
        if (supportedStrategies?.includes("reset_password_email_code")) {
          showNotification("Your password needs to be reset. Please check your email for reset instructions.", "info");
          onForgotPassword();
        } else if (supportedStrategies?.includes("email_code")) {
          showNotification("Please check your email for the verification code.", "info");
        } else {
          showNotification("Please complete the verification process.", "info");
        }
      } else if (result.status === "needs_new_password") {
        // Password was changed or expired
        console.log("[ClerkSignInForm] Needs new password");
        showNotification("Your password has been changed. Please check your email or reset your password.", "info");
        // Redirect to forgot password page
        onForgotPassword();
      } else if (result.status === "needs_second_factor") {
        // 2FA required
        console.log("[ClerkSignInForm] Needs second factor (2FA)");
        showNotification("Two-factor authentication required.", "info");
      } else {
        // Handle any other status
        console.warn("[ClerkSignInForm] Unhandled sign-in status:", result.status);
        showNotification(`Sign-in status: ${result.status}. Please try again or contact support.`, "warning");
      }
    } catch (error) {
      console.error("[ClerkSignInForm] Sign-in error:", error);
      
      // Handle Clerk-specific error structures
      let errorMessage = "Invalid email or password";
      
      if (error && typeof error === 'object') {
        const clerkError = error as any;
        console.error("[ClerkSignInForm] Error details:", {
          message: clerkError.message,
          status: clerkError.status,
          errors: clerkError.errors,
        });
        
        // Check for specific Clerk error codes
        if (clerkError.errors && Array.isArray(clerkError.errors)) {
          const firstError = clerkError.errors[0];
          if (firstError?.code === "form_password_incorrect") {
            errorMessage = "Incorrect password. If you recently changed your password, please use the new password.";
          } else if (firstError?.code === "form_identifier_not_found") {
            errorMessage = "Email not found. Please check your email or sign up.";
          } else if (firstError?.code === "session_exists") {
            errorMessage = "You already have an active session. Please sign out and try again.";
          } else if (firstError?.message) {
            errorMessage = firstError.message;
          }
        } else if (clerkError.message) {
          errorMessage = clerkError.message;
        }
      }
      
      showNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CalorieIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
        <p className="mt-2 text-muted">
          Sign in to continue tracking your macros
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => handleSocialSignIn("oauth_google")}
          icon={<GoogleIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => handleSocialSignIn("oauth_facebook")}
          icon={<FacebookIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with Facebook
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => handleSocialSignIn("oauth_apple")}
          icon={<AppleIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with Apple
        </Button>
      </div>

      <div className="mb-6 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="mx-4 text-xs font-semibold uppercase tracking-wide text-muted">
          or
        </span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-5">
        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          required
          placeholder="your@email.com"
          name="email"
          autoComplete="username"
        />

        <TextField
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          required
          placeholder="••••••••"
          name="password"
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary transition-colors hover:text-primary"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          loadingText="Signing in..."
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
