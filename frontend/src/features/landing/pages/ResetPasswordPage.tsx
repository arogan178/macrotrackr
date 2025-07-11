import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default ResetPasswordPage;
