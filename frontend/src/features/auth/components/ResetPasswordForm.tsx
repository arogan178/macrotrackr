import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CardContainer, TextField } from "@/components/form";
import LoadingSpinner from "@/components/LoadingSpinner";
import { LockIcon } from "@/components/Icons";
import { useStore } from "@/store/store";
import { ApiError } from "@/utils/api-service";

function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const {
    auth: { isLoading },
    resetPassword,
    showNotification,
  } = useStore();

  const token = searchParams.get("token");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      showNotification("No reset token found.", "error");
      return;
    }
    try {
      await resetPassword(token, newPassword);
      showNotification("Password has been reset successfully.", "success");
      navigate("/login");
    } catch (error) {
      if (error instanceof ApiError) {
        showNotification(error.message || "Reset failed", "error");
      } else if (error instanceof Error) {
        showNotification(error.message || "Reset failed", "error");
      } else {
        showNotification("An unexpected error occurred.", "error");
      }
    }
  }

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-teal-400 mb-4 flex items-center justify-center shadow-lg shadow-green-500/30">
          <LockIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          Reset Password
        </h1>
        <p className="mt-2 text-gray-400">Enter your new password</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          type="password"
          required={true}
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={isLoading || !token}
          className="w-full p-3 rounded-lg font-medium text-white 
                 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-500 hover:to-teal-400
                 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                 shadow-lg shadow-green-500/30"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </CardContainer>
  );
}

export default ResetPasswordForm;
