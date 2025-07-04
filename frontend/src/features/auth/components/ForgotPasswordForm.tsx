import { useState } from "react";
import { CardContainer, TextField } from "@/components/form";
import LoadingSpinner from "@/components/LoadingSpinner";
import { EmailIcon } from "@/components/Icons";
import { useStore } from "@/store/store";
import { ApiError } from "@/utils/api-service";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const {
    auth: { isLoading },
    forgotPassword,
    showNotification,
  } = useStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await forgotPassword(email);
      showNotification(
        "If an account exists, a reset link has been sent.",
        "success"
      );
    } catch (error) {
      if (error instanceof ApiError) {
        showNotification(error.message || "Request failed", "error");
      } else if (error instanceof Error) {
        showNotification(error.message || "Request failed", "error");
      } else {
        showNotification("An unexpected error occurred.", "error");
      }
    }
  }

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <EmailIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          Forgot Password
        </h1>
        <p className="mt-2 text-gray-400">
          Enter your email to get a reset link
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          required={true}
          placeholder="your@email.com"
          maxLength={30}
        />
        <div className="text-right">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Back to Login
          </button>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 rounded-lg font-medium text-white 
                 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                 shadow-lg shadow-indigo-500/30"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>
    </CardContainer>
  );
}

export default ForgotPasswordForm;
