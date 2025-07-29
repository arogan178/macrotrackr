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
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <CalorieIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          Welcome Back
        </h1>
        <p className="mt-2 text-gray-400">Sign in to track your macros</p>
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
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Forgot Password?
          </button>
        </div>
        <Button
          type="submit"
          autoLoadingFeature="auth"
          loadingText="Signing in..."
          fullWidth={true}
          className="p-3 rounded-lg font-medium text-white 
                 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                 shadow-lg shadow-indigo-500/30"
        >
          Sign In
        </Button>
      </form>
    </CardContainer>
  );
}

export default FormLogin;
