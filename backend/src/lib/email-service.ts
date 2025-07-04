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
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 1 hour.</p>
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
