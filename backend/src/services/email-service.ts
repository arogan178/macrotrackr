import { Resend } from "resend";
import { config } from "../config";
import { logger } from "../lib/observability/logger";

export interface EmailService {
  sendPasswordResetEmail: (to: string, token: string) => Promise<void>;
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resend = new Resend(config.RESEND_API_KEY);
  const [, domain] = config.SUPPORT_EMAIL.split("@");
  const from = domain ? `noreply@${domain}` : "noreply@local.invalid";
  const baseUrl = config.APP_URL.replace(/\/$/, "");
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const logoUrl = `${baseUrl}/logo.svg`;
  const appName = config.PUBLIC_APP_NAME;

  logger.info(
    { type: "email_send", operation: "password_reset", to: to.replace(/(.{2}).*@/, "$1***@") },
    "Sending password reset email"
  );

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 32px; border-radius: 8px; max-width: 480px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${logoUrl}" alt="${appName}" style="height: 48px; margin-bottom: 8px;" />
            <h2 style="color: #0f172a; margin: 0; font-size: 1.5rem;">Reset Your Password</h2>
          </div>
          <p style="color: #334155; font-size: 1rem;">We received a request to reset your ${appName} password. Click the button below to set a new password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 6px; font-size: 1.1rem; text-decoration: none; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 1px 4px rgba(37,99,235,0.08);">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 0.95rem;">If you did not request this, you can safely ignore this email. For security, this link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
          <div style="text-align: center; color: #94a3b8; font-size: 0.9rem;">&copy; ${new Date().getFullYear()} ${appName}</div>
        </div>
      `,
    });
    if (result.error) {
      logger.error(
        { type: "email_error", operation: "password_reset", error: result.error },
        "Resend API error sending password reset email"
      );
    } else {
      logger.info(
        { type: "email_sent", operation: "password_reset", messageId: result.data.id },
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
}

export const emailService: EmailService = { sendPasswordResetEmail };
