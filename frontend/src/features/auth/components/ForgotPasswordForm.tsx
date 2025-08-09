import { useState } from "react";

import { CardContainer, TextField } from "@/components/form";
import { BackIcon, Button, EmailIcon } from "@/components/ui";
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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary shadow-primary/30 shadow-primary">
          <EmailIcon className="h-8 w-8 text-foreground" />
        </div>
        <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-3xl font-bold text-transparent">
          Forgot Password
        </h1>
        <p className="mt-2 text-foreground">
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
          name="email"
          autoComplete="email"
        />
        <Button
          type="submit"
          autoLoadingFeature="auth"
          loadingText="Sending..."
          className="w-full"
        >
          Send Reset Link
        </Button>
      </form>
      <div className="mt-4 text-right">
        <Button
          text="Back to Login"
          type="button"
          variant="ghost"
          className="text-sm text-muted hover:text-foreground"
          onClick={onSwitchToLogin}
          icon={<BackIcon />}
          iconPosition="left"
        />
      </div>
    </CardContainer>
  );
}

export default ForgotPasswordForm;
