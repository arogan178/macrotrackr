import { Resend } from "resend";
import { config } from "../config";

const resend = new Resend(config.RESEND_API_KEY);

export const emailService = {
  sendPasswordResetEmail: async (to: string, token: string) => {
    const resetLink = `${config.CORS_ORIGIN}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: "noreply@macrotrackr.com",
        to,
        subject: "Reset Your Password",
        html: `
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      // In a real app, you might want to have more robust error handling here
      // For now, we'll just log the error
    }
  },
};
