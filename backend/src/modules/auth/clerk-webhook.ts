// src/modules/auth/clerk-webhook.ts
import { Elysia } from "elysia";
import { WebhookVerificationError, Webhook as SvixWebhook } from "svix";
import { db } from "../../db";
import { config } from "../../config";
import { logger } from "../../lib/logger";
import { safeQuery, safeExecute } from "../../lib/database";

// Type for Clerk webhook events
interface ClerkWebhookEvent {
  data: {
    id: string;
    email_addresses?: Array<{
      id?: string;
      email_address: string;
    }>;
    primary_email_address_id?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
  object: string;
  type: string;
}

function verifyWebhookSignature(request: Request, payload: string): ClerkWebhookEvent {
  const secret = config.CLERK_WEBHOOK_SECRET;
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!secret || !svixId || !svixTimestamp || !svixSignature) {
    throw new WebhookVerificationError("Missing Clerk Svix headers or secret");
  }

  const webhook = new SvixWebhook(secret);
  return webhook.verify(payload, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  }) as ClerkWebhookEvent;
}

function getPrimaryEmail(event: ClerkWebhookEvent): string | undefined {
  const primaryEmailAddressId = event.data.primary_email_address_id;
  if (!event.data.email_addresses || event.data.email_addresses.length === 0) {
    return undefined;
  }

  if (primaryEmailAddressId) {
    const primaryEmail = event.data.email_addresses.find(
      (address) => address.id === primaryEmailAddressId,
    );
    if (primaryEmail?.email_address) {
      return primaryEmail.email_address;
    }
  }

  return event.data.email_addresses[0]?.email_address;
}

/**
 * Handle user.created event from Clerk
 */
async function handleUserCreated(event: ClerkWebhookEvent) {
  const clerkUserId = event.data.id;
  const email = getPrimaryEmail(event);
  const firstName = event.data.first_name || "";
  const lastName = event.data.last_name || "";

  if (!email) {
    logger.error({ clerkUserId }, "No email found in Clerk user.created event");
    return;
  }

  logger.info({ clerkUserId, email }, "Processing Clerk user.created webhook");

  // Only update already-linked users. New users are created by /api/auth/clerk-sync.
  const existingUser = safeQuery<{ id: number }>(
    db,
    "SELECT id FROM users WHERE clerk_id = ?",
    [clerkUserId]
  );

  if (existingUser) {
    safeExecute(
      db,
      "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?",
      [firstName, lastName, existingUser.id]
    );
    logger.info(
      { userId: existingUser.id, clerkUserId },
      "Updated existing linked user from Clerk webhook"
    );
    return;
  }

  logger.info(
    { clerkUserId, email },
    "Ignoring Clerk user.created webhook until the app explicitly syncs the account",
  );
}

/**
 * Handle user.updated event from Clerk
 */
async function handleUserUpdated(event: ClerkWebhookEvent) {
  const clerkUserId = event.data.id;
  const email = getPrimaryEmail(event);
  const firstName = event.data.first_name || "";
  const lastName = event.data.last_name || "";

  logger.info({ clerkUserId }, "Processing Clerk user.updated webhook");

  const existingUser = safeQuery<{ id: number }>(
    db,
    "SELECT id FROM users WHERE clerk_id = ?",
    [clerkUserId]
  );

  if (!existingUser) {
    logger.info(
      { clerkUserId, email },
      "Ignoring Clerk user.updated webhook for an unlinked account",
    );
    return;
  }

  if (email) {
    const emailOwner = safeQuery<{ id: number }>(
      db,
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND (clerk_id IS NULL OR clerk_id != ?)",
      [email, clerkUserId],
    );

    if (emailOwner) {
      logger.warn(
        { clerkUserId, existingUserId: emailOwner.id },
        "Skipping Clerk email update because the email belongs to another user",
      );
      safeExecute(
        db,
        "UPDATE users SET first_name = ?, last_name = ? WHERE clerk_id = ?",
        [firstName, lastName, clerkUserId],
      );
      return;
    }
  }

  if (!email) {
    safeExecute(
      db,
      "UPDATE users SET first_name = ?, last_name = ? WHERE clerk_id = ?",
      [firstName, lastName, clerkUserId],
    );
    return;
  }

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
      const { request } = context;
      const payload = await request.text();

      if (!config.CLERK_WEBHOOK_SECRET) {
        logger.warn("Missing Clerk webhook secret");
        context.set.status = 500;
        return {
          success: false,
          message: "Clerk webhook secret is not configured",
        };
      }

      let event: ClerkWebhookEvent;
      try {
        event = verifyWebhookSignature(request, payload);
      } catch (error) {
        logger.warn({ error }, "Invalid Clerk webhook signature");
        context.set.status = 400;
        return {
          success: false,
          message: "Unauthorized",
        };
      }

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
        context.set.status = 500;
        return {
          success: false,
          message: "Failed to process webhook",
        };
      }
    },
    {
      parse: "text",
      detail: {
        summary: "Handle Clerk webhooks",
        description: "Receives and processes webhook events from Clerk (user.created, user.updated, user.deleted)",
        tags: ["Webhooks"],
      },
    }
  );
