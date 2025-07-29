import { useState } from "react";

import { CardContainer, FormButton, TextField } from "@/components/form";
import { EmailIcon } from "@/components/ui";
import { useMutationErrorHandler } from "@/hooks";
import { useForgotPassword } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const { showNotification } = useStore();
  const forgotPasswordMutation = useForgotPassword();

  // Use new mutation error handling
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => showNotification(message, "error"),
      onSuccess: (message) => showNotification(message, "success"),
    });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      handleMutationSuccess(
        "If an account exists, a reset link has been sent.",
      );
    } catch (error) {
      handleMutationError(error, "sending password reset email");
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
        <FormButton
          type="submit"
          autoLoadingFeature="auth"
          loadingText="Sending..."
          className="w-full"
        >
          Send Reset Link
        </FormButton>
      </form>
      <div className="text-right mt-4">
        <FormButton
          type="button"
          variant="ghost"
          className="text-sm"
          onClick={onSwitchToLogin}
        >
          Back to Login
        </FormButton>
      </div>
    </CardContainer>
  );
}

export default ForgotPasswordForm;
