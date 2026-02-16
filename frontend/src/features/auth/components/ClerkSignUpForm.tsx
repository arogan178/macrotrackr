import { useSignUp } from "@clerk/clerk-react";
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

interface ClerkSignUpFormProps {
  onSwitchToSignIn: () => void;
  redirectTo?: string;
}

export function ClerkSignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: ClerkSignUpFormProps) {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { showNotification } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  // Handle social sign-up
  const handleSocialSignUp = async (
    strategy: "oauth_google" | "oauth_facebook" | "oauth_apple",
  ) => {
    if (!isLoaded || !signUp) {
      showNotification("Authentication not ready. Please try again.", "error");
      return;
    }

    try {
      const destination = redirectTo || "/home";
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: `/sso-callback?redirectTo=${encodeURIComponent(destination)}`,
        redirectUrlComplete: `/auth-ready?redirectTo=${encodeURIComponent(destination)}`,
      });
    } catch (error) {
      console.error("Social sign-up error:", error);
      showNotification(
        error instanceof Error ? error.message : "Social sign-up failed",
        "error",
      );
    }
  };

  // Handle email/password sign-up
  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoaded || !signUp) {
      showNotification("Authentication not ready. Please try again.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (result.status === "complete") {
        // Sign-up complete, set session and redirect to auth-ready
        // AuthReadyPage will set the token and then redirect to the intended destination
        await setActive({ session: result.createdSessionId });
        navigate({
          to: "/auth-ready",
          search: { redirectTo: redirectTo || "/home" },
        });
      } else if (result.status === "missing_requirements") {
        // Email verification required
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerifying(true);
        showNotification(
          "Please check your email for the verification code",
          "success",
        );
      }
    } catch (error) {
      console.error("Sign-up error:", error);
      showNotification(
        error instanceof Error ? error.message : "Sign-up failed",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoaded || !signUp) return;

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        // Verification complete, set session and redirect to auth-ready
        // AuthReadyPage will set the token and then redirect to the intended destination
        await setActive({ session: result.createdSessionId });
        showNotification("Email verified successfully!", "success");
        navigate({
          to: "/auth-ready",
          search: { redirectTo: redirectTo || "/home" },
        });
      } else {
        showNotification(
          "Invalid verification code. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      showNotification(
        error instanceof Error ? error.message : "Verification failed",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show verification form
  if (verifying) {
    return (
      <div className="w-full">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CalorieIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Verify Your Email
          </h1>
          <p className="mt-2 text-muted">
            We&apos;ve sent a verification code to {email}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <TextField
            label="Verification Code"
            value={code}
            onChange={setCode}
            type="text"
            required
            placeholder="123456"
            maxLength={6}
            name="verificationCode"
            autoComplete="one-time-code"
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            loadingText="Verifying..."
          >
            Verify Email
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVerifying(false)}
            className="text-sm text-primary hover:underline"
          >
            Back to sign up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CalorieIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
        <p className="mt-2 text-muted">Sign up to start tracking your macros</p>
      </div>

      <div className="mb-6 space-y-3">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => handleSocialSignUp("oauth_google")}
          icon={<GoogleIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => handleSocialSignUp("oauth_facebook")}
          icon={<FacebookIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with Facebook
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => handleSocialSignUp("oauth_apple")}
          icon={<AppleIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with Apple
        </Button>
      </div>

      <div className="mb-6 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="mx-4 text-xs font-semibold tracking-wide text-muted uppercase">
          or
        </span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleEmailSignUp} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            required
            placeholder="John"
            textOnly
            name="firstName"
            autoComplete="given-name"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            required
            placeholder="Doe"
            textOnly
            name="lastName"
            autoComplete="family-name"
          />
        </div>

        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          required
          placeholder="your@email.com"
          name="email"
          autoComplete="email"
        />

        <TextField
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          required
          placeholder="••••••••"
          name="password"
          autoComplete="new-password"
        />

        {/* Clerk CAPTCHA element - required for bot protection */}
        <div id="clerk-captcha" className="hidden" />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          loadingText="Creating account..."
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
