import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";

import CardContainer from "@/components/form/CardContainer";
import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { CalorieIcon, GithubIcon,GoogleIcon } from "@/components/ui/Icons";
import { useLogin } from "@/hooks/auth/useAuthQueries";
import { useMutationErrorHandler } from "@/hooks/useMutationErrorHandler";
import { useStore } from "@/store/store";
import { ApiError } from "@/utils/apiServices";

interface LoginFormProps {
  onForgotPassword: () => void;
}

function FormLogin({ onForgotPassword }: LoginFormProps) {
  const navigate = useNavigate();
  const { isLoaded, signIn } = useSignIn();
  const {
    loginEmail,
    loginPassword,
    setLoginEmail,
    setLoginPassword,
    clearLoginForm,
    showNotification,
  } = useStore();

  const loginMutation = useLogin();

  // Use new loading state hooks
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => showNotification(message, "error"),
      onSuccess: (message) => showNotification(message, "success"),
    });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword,
      });
      handleMutationSuccess("Login successful");
      clearLoginForm();
    } catch (error) {
      // Handle specific auth errors with custom messages
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        handleMutationError(
          new Error("Invalid email or password"),
          "logging in",
        );
      } else {
        handleMutationError(error, "logging in");
      }
    }
  }

  // Handle social sign-in with Clerk
  async function handleSocialSignIn(strategy: "oauth_google" | "oauth_github") {
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
        "error"
      );
    }
  }

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CalorieIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Welcome</h1>
        <p className="mt-2 text-muted">Sign in to track your macros</p>
      </div>

      {/* Social Sign In Buttons */}
      <div className="mb-6 space-y-3">
        <Button
          type="button"
          variant="outline"
          fullWidth={true}
          onClick={() => handleSocialSignIn("oauth_google")}
          icon={<GoogleIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth={true}
          onClick={() => handleSocialSignIn("oauth_github")}
          icon={<GithubIcon className="h-5 w-5" />}
          iconPosition="left"
        >
          Continue with GitHub
        </Button>
      </div>

      {/* Divider */}
      <div className="mb-6 flex items-center">
        <div className="flex-1 border-t border-border"></div>
        <span className="mx-4 text-sm text-muted">or</span>
        <div className="flex-1 border-t border-border"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Email"
          value={loginEmail}
          onChange={setLoginEmail}
          type="email"
          required={true}
          placeholder="your@email.com"
          maxLength={30}
          name="email"
          autoComplete="username"
        />
        <TextField
          label="Password"
          value={loginPassword}
          onChange={setLoginPassword}
          type="password"
          required={true}
          placeholder="••••••••"
          name="password"
          autoComplete="current-password"
        />
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary transition-colors hover:text-primary"
          >
            Forgot Password?
          </button>
        </div>
        <Button
          type="submit"
          autoLoadingFeature="auth"
          loadingText="Signing in..."
          fullWidth={true}
        >
          Sign In
        </Button>
      </form>
    </CardContainer>
  );
}

export default FormLogin;
