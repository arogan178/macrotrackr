import { Resend } from "resend";
import { config } from "../config";

const resend = new Resend(config.RESEND_API_KEY);

export const emailService = {
  sendPasswordResetEmail: async (to: string, token: string) => {
    const resetLink = `${config.CORS_ORIGIN}/reset-password?token=${token}`;

    try {
      const result = await resend.emails.send({
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
      if (result && result.error) {
        console.error("Resend API error:", result.error);
      } else {
        console.log(
          `Password reset email sent to ${to}. Resend response:`,
          result
        );
      }
    } catch (error) {
      console.error("Failed to send password reset email (exception):", error);
    }
  },
};
