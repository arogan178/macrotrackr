// src/modules/auth/clerk-webhook.ts
import { Elysia } from "elysia";
import { db } from "../../db";
import { config } from "../../config";
import { logger } from "../../lib/logger";
import { safeQuery, safeExecute, withTransaction } from "../../lib/database";
import crypto from "crypto";

// Type for Clerk webhook events
interface ClerkWebhookEvent {
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
  object: string;
  type: string;
}

/**
 * Verify Clerk webhook signature
 * Clerk webhooks include a signature in the Svix-Signature header
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const signedContent = `${payload}.${signature}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedContent)
      .digest("hex");
    return signature === expectedSignature;
  } catch (error) {
    logger.error({ error }, "Failed to verify webhook signature");
    return false;
  }
}

/**
 * Handle user.created event from Clerk
 */
async function handleUserCreated(event: ClerkWebhookEvent) {
  const clerkUserId = event.data.id;
  const email = event.data.email_addresses?.[0]?.email_address;
  const firstName = event.data.first_name || "";
  const lastName = event.data.last_name || "";

  if (!email) {
    logger.error({ clerkUserId }, "No email found in Clerk user.created event");
    return;
  }

  logger.info({ clerkUserId, email }, "Processing Clerk user.created webhook");

  // Check if user already exists
  const existingUser = safeQuery<{ id: number }>(
    db,
    "SELECT id FROM users WHERE email = ? OR clerk_id = ?",
    [email, clerkUserId]
  );

  if (existingUser) {
    // Update existing user with Clerk ID
    safeExecute(
      db,
      "UPDATE users SET clerk_id = ?, first_name = ?, last_name = ? WHERE id = ?",
      [clerkUserId, firstName, lastName, existingUser.id]
    );
    logger.info(
      { userId: existingUser.id, clerkUserId },
      "Updated existing user with Clerk ID"
    );
    return;
  }

  // Create new user
  withTransaction(db, () => {
    // Insert user
    const userResult = safeExecute(
      db,
      "INSERT INTO users (email, first_name, last_name, clerk_id, password) VALUES (?, ?, ?, ?, ?)",
      [email, firstName, lastName, clerkUserId, "clerk-auth"]
    );
    const userId = Number(userResult.lastInsertRowid);

    // Insert default user details
    safeExecute(
      db,
      `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
       VALUES (?, NULL, NULL, NULL, NULL, NULL)`,
      [userId]
    );

    // Insert default macro targets
    safeExecute(
      db,
      `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
       VALUES (?, 30, 40, 30, '[]')`,
      [userId]
    );

    logger.info({ userId, clerkUserId }, "Created new user from Clerk webhook");
  });
}

/**
 * Handle user.updated event from Clerk
 */
async function handleUserUpdated(event: ClerkWebhookEvent) {
  const clerkUserId = event.data.id;
  const email = event.data.email_addresses?.[0]?.email_address ?? "";
  const firstName = event.data.first_name || "";
  const lastName = event.data.last_name || "";

  logger.info({ clerkUserId }, "Processing Clerk user.updated webhook");

  // Update user in our database
  safeExecute(
    db,
    "UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE clerk_id = ?",
    [email, firstName, lastName, clerkUserId]
  );
}

/**
 * Handle user.deleted event from Clerk
 */
async function handleUserDeleted(event: ClerkWebhookEvent) {
  const clerkUserId = event.data.id;

  logger.info({ clerkUserId }, "Processing Clerk user.deleted webhook");

  // Find and delete user from our database
  const user = safeQuery<{ id: number }>(
    db,
    "SELECT id FROM users WHERE clerk_id = ?",
    [clerkUserId]
  );

  if (user) {
    safeExecute(db, "DELETE FROM users WHERE id = ?", [user.id]);
    logger.info({ userId: user.id, clerkUserId }, "Deleted user from database");
  }
}

/**
 * Clerk webhook handler
 * Receives and processes webhook events from Clerk
 */
export const clerkWebhookHandler = (app: Elysia) =>
  app.post(
    "/api/webhooks/clerk",
    async (context: any) => {
      const { request, body } = context;

      // Get the webhook signature from headers
      const signature = request.headers.get("svix-signature");
      const secret = config.CLERK_WEBHOOK_SECRET;

      if (!signature || !secret) {
        logger.warn("Missing webhook signature or secret");
        return {
          success: false,
          message: "Unauthorized",
        };
      }

      // Verify webhook signature
      const payload = JSON.stringify(body);
      if (!verifyWebhookSignature(payload, signature, secret)) {
        logger.warn("Invalid webhook signature");
        return {
          success: false,
          message: "Unauthorized",
        };
      }

      const event = body as ClerkWebhookEvent;

      logger.info(
        { eventType: event.type, clerkUserId: event.data.id },
        "Received Clerk webhook"
      );

      try {
        // Handle different event types
        switch (event.type) {
          case "user.created":
            await handleUserCreated(event);
            break;
          case "user.updated":
            await handleUserUpdated(event);
            break;
          case "user.deleted":
            await handleUserDeleted(event);
            break;
          default:
            logger.debug({ eventType: event.type }, "Unhandled webhook event");
        }

        return {
          success: true,
          message: "Webhook processed successfully",
        };
      } catch (error) {
        logger.error({ error, eventType: event.type }, "Failed to process webhook");
        return {
          success: false,
          message: "Failed to process webhook",
        };
      }
    },
    {
      detail: {
        summary: "Handle Clerk webhooks",
        description: "Receives and processes webhook events from Clerk (user.created, user.updated, user.deleted)",
        tags: ["Webhooks"],
      },
    }
  );
