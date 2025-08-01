import { CardContainer, TextField } from "@/components/form";
import { Button, CalorieIcon, LoadingSpinner } from "@/components/ui";
import { useFeatureLoading, useMutationErrorHandler } from "@/hooks";
import { useLogin } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";
import { ApiError } from "@/utils/apiServices";

interface LoginFormProps {
  onForgotPassword: () => void;
}

function FormLogin({ onForgotPassword }: LoginFormProps) {
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
  const { isLoading: isAuthLoading } = useFeatureLoading("auth");
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

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary shadow-primary/30 shadow-primary">
          <CalorieIcon className="h-8 w-8 text-foreground" />
        </div>
        <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-3xl font-bold text-transparent">
          Welcome
        </h1>
        <p className="mt-2 text-foreground">Sign in to track your macros</p>
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
        />
        <TextField
          label="Password"
          value={loginPassword}
          onChange={setLoginPassword}
          type="password"
          required={true}
          placeholder="••••••••"
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
          className="transform rounded-lg bg-gradient-to-r from-primary 
                 to-primary p-3 font-medium text-foreground shadow-primary/30
                 shadow-primary transition-all duration-300 hover:scale-[1.02] hover:from-primary
                 hover:to-primary disabled:opacity-50"
        >
          Sign In
        </Button>
      </form>
    </CardContainer>
  );
}

export default FormLogin;
