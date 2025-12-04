import { Resend } from "resend";
import { config } from "../config";
import { logger } from "./logger";

const resend = new Resend(config.RESEND_API_KEY);

// Log config at startup
logger.info(
  {
    type: "email_service_init",
    hasApiKey: !!config.RESEND_API_KEY,
    corsOrigin: config.CORS_ORIGIN,
  },
  "Email service initialized"
);

export const emailService = {
  sendPasswordResetEmail: async (to: string, token: string) => {
    logger.info(
      { type: "email_send", operation: "password_reset", to: to.replace(/(.{2}).*@/, "$1***@") },
      "Sending password reset email"
    );
    const resetLink = `${config.CORS_ORIGIN}/reset-password?token=${token}`;

    try {
      const result = await resend.emails.send({
        from: "noreply@macrotrackr.com",
        to,
        subject: "Reset Your Password",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 32px; border-radius: 8px; max-width: 480px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://macrotrackr.com/logo.svg" alt="Macro Trackr" style="height: 48px; margin-bottom: 8px;" />
              <h2 style="color: #0f172a; margin: 0; font-size: 1.5rem;">Reset Your Password</h2>
            </div>
            <p style="color: #334155; font-size: 1rem;">We received a request to reset your Macro Trackr password. Click the button below to set a new password. This link will expire in 1 hour.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 6px; font-size: 1.1rem; text-decoration: none; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 1px 4px rgba(37,99,235,0.08);">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 0.95rem;">If you did not request this, you can safely ignore this email. For security, this link will expire in 1 hour.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
            <div style="text-align: center; color: #94a3b8; font-size: 0.9rem;">&copy; ${new Date().getFullYear()} Macro Trackr</div>
          </div>
        `,
      });
      if (result && result.error) {
        logger.error(
          { type: "email_error", operation: "password_reset", error: result.error },
          "Resend API error sending password reset email"
        );
      } else {
        logger.info(
          { type: "email_sent", operation: "password_reset", messageId: result?.data?.id },
          "Password reset email sent successfully"
        );
      }
    } catch (error) {
      logger.error(
        {
          type: "email_exception",
          operation: "password_reset",
          error: error instanceof Error ? error : new Error(String(error)),
        },
        "Failed to send password reset email"
      );
    }
  },
};
