import { CardContainer, TextField } from "@/components/form";
import { CalorieIcon } from "@/components/ui";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword,
      });
      showNotification("Login successful", "success");
      clearLoginForm();
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        showNotification("Invalid email or password.", "error");
      } else if (error instanceof ApiError) {
        showNotification(error.message || "Login failed", "error");
      } else if (error instanceof Error) {
        showNotification(error.message || "Login failed", "error");
      } else {
        showNotification(
          "Login failed. Please check your credentials.",
          "error",
        );
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
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full p-3 rounded-lg font-medium text-white 
                 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                 shadow-lg shadow-indigo-500/30"
        >
          {loginMutation.isPending ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </CardContainer>
  );
}

export default FormLogin;
