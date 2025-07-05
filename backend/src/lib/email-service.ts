import { Resend } from "resend";
import { config } from "../config";
import fs from "fs";
import path from "path";

const resend = new Resend(config.RESEND_API_KEY);
const logFile = path.join(process.cwd(), "email-service.log");

function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

// Log config at startup
logToFile(`RESEND_API_KEY loaded: ${!!config.RESEND_API_KEY}`);
logToFile(`CORS_ORIGIN loaded: ${config.CORS_ORIGIN}`);

export const emailService = {
  sendPasswordResetEmail: async (to: string, token: string) => {
    logToFile(`sendPasswordResetEmail called for: ${to}`);
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
        logToFile(`Resend API error: ${JSON.stringify(result.error)}`);
        console.error("Resend API error:", result.error);
      } else {
        logToFile(
          `Password reset email sent to ${to}. Resend response: ${JSON.stringify(
            result
          )}`
        );
        console.log(
          `Password reset email sent to ${to}. Resend response:`,
          result
        );
      }
    } catch (error) {
      logToFile(
        `Failed to send password reset email (exception): ${
          error instanceof Error ? error.stack : error
        }`
      );
      console.error("Failed to send password reset email (exception):", error);
    }
  },
};
