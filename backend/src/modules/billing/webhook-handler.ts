// src/modules/billing/webhook-handler.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { logger } from "../../lib/logger";
import { StripeService } from "./stripe-service";
import { SubscriptionService } from "./subscription-service";

/**
 * Stripe webhook handler - must be mounted before auth middleware
 * to preserve raw body for signature verification
 */
export const webhookHandler = new Elysia({ name: "webhookHandler" })
  .decorate("db", db)
  .post(
    "/api/billing/webhook",
    async (ctx: any) => {
      try {
        // Get the raw body text from custom parse function
        const rawBodyText = ctx.body;
        const signature = ctx.headers["stripe-signature"];

        logger.info(
          {
            operation: "stripe_webhook",
            hasRawBody: !!rawBodyText,
            rawBodyLength: rawBodyText?.length || 0,
            hasSignature: !!signature,
            signature: signature ? signature.substring(0, 20) + "..." : "none",
            rawBodyPreview:
              rawBodyText ? rawBodyText.substring(0, 100) + "..." : "none",
          },
          "Received Stripe webhook request"
        );

        if (!signature) {
          logger.error(
            { operation: "stripe_webhook", error: "Missing Stripe signature" },
            "Missing Stripe signature header"
          );
          ctx.set.status = 400;
          return { received: false, error: "Missing Stripe signature" };
        }

        if (!rawBodyText || rawBodyText.length === 0) {
          logger.error(
            {
              operation: "stripe_webhook",
              error: "Missing or empty request body",
            },
            "Missing or empty request body for webhook"
          );
          ctx.set.status = 400;
          return { received: false, error: "Missing request body" };
        }

        // Verify webhook signature and normalize event format
        let normalizedEvent;
        try {
          normalizedEvent = await StripeService.verifyWebhookSignature(
            rawBodyText,
            signature
          );
        } catch (err) {
          logger.error(
            { operation: "stripe_webhook", error: err },
            "Signature verification or event parsing failed"
          );
          ctx.set.status = 400;
          return { received: false, error: "Signature verification failed" };
        }

        // Deduplication: check if event ID already processed
        const eventId = normalizedEvent.id;
        const eventExists = ctx.db
          .prepare("SELECT 1 FROM stripe_events WHERE id = ?")
          .get(eventId);
        if (eventExists) {
          logger.warn(
            { operation: "stripe_webhook", eventId },
            `Duplicate Stripe event received, skipping: ${eventId}`
          );
          ctx.set.status = 200;
          return { received: true, duplicate: true, eventId };
        }

        logger.info(
          {
            operation: "stripe_webhook",
            eventType: normalizedEvent.type,
            eventId: normalizedEvent.id,
            format: normalizedEvent.format,
            payload: normalizedEvent,
          },
          `Processing Stripe webhook: ${normalizedEvent.type} (${normalizedEvent.format})`
        );

        // Handle only supported event types
        if (
          normalizedEvent.type &&
          normalizedEvent.type.includes("subscription")
        ) {
          await handleSubscriptionEvent(ctx.db, normalizedEvent, eventId);
        } else {
          // Log and gracefully handle unsupported event types
          logger.info(
            {
              operation: "stripe_webhook",
              eventType: normalizedEvent?.type,
              eventId,
            },
            `Received unsupported or unhandled event type: ${normalizedEvent?.type}`
          );
        }

        // Insert event ID into stripe_events for deduplication
        ctx.db.prepare("INSERT INTO stripe_events (id) VALUES (?)").run(eventId);

        ctx.set.status = 200;
        return {
          received: true,
          format: normalizedEvent.format,
          eventType: normalizedEvent.type,
          eventId,
        };
        } catch (error) {
          logger.error(
            {
              error: error instanceof Error ? error : new Error(String(error)),
              operation: "stripe_webhook",
            },
            "Failed to process webhook"
          );
          ctx.set.status = 500;
          return { received: false, error: "Webhook processing failed" };
        }
      },
      {
        // Custom parse function to handle Stripe webhook raw body
        async parse(ctx) {
          const contentType = ctx.request.headers.get("content-type");
          if (contentType?.startsWith("application/json")) {
            const reqText = await ctx.request.text();
            return reqText;
          }

          return undefined;
        },
      headers: t.Object({
        "stripe-signature": t.String(),
      }),
      body: t.String(),
      detail: {
        summary: "Handle Stripe webhooks (NO AUTH)",
        tags: ["Billing"],
      },
    }
  );

/**
 * Handle subscription-related webhook events
 */
async function handleSubscriptionEvent(
  db: any,
  normalizedEvent: any,
  eventId: string
): Promise<void> {
  let subscription;
  
  if (normalizedEvent.format === "thin" && normalizedEvent.related_object) {
    subscription = await StripeService.fetchRelatedObject(
      normalizedEvent.related_object
    );
  } else if (normalizedEvent.data?.object) {
    subscription = normalizedEvent.data.object;
  }

  if (!subscription) {
    logger.warn(
      { operation: "stripe_webhook", eventId },
      "No subscription data found in event"
    );
    return;
  }

  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // Find user by Stripe customer ID
  const user = db
    .prepare("SELECT id FROM users WHERE stripe_customer_id = ?")
    .get(customerId) as { id: number } | undefined;

  if (!user) {
    logger.warn(
      {
        operation: "stripe_webhook",
        eventType: normalizedEvent.type,
        customerId,
        subscriptionId,
        eventId,
      },
      "User not found for Stripe customer ID"
    );
    return;
  }

  if (status === "canceled" || normalizedEvent.type.includes("deleted")) {
    await SubscriptionService.cancelSubscription(user.id, subscriptionId);
    logger.info(
      {
        operation: "stripe_webhook_processed",
        eventType: normalizedEvent.type,
        userId: user.id,
        subscriptionId,
        eventId,
      },
      "Canceled subscription from webhook"
    );
  } else {
    const subscriptionItem = subscription.items?.data?.[0];
    if (!subscriptionItem) {
      throw new Error("Subscription has no items");
    }
    const currentPeriodEnd = new Date(
      subscriptionItem.current_period_end * 1000
    ).toISOString();
    
    await SubscriptionService.upsertSubscription(
      user.id,
      subscriptionId,
      status,
      currentPeriodEnd
    );
    logger.info(
      {
        operation: "stripe_webhook_processed",
        eventType: normalizedEvent.type,
        userId: user.id,
        subscriptionId,
        status,
        eventId,
      },
      "Updated subscription from webhook"
    );
  }
}
