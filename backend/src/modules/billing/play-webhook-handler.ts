// src/modules/billing/play-webhook-handler.ts

import { Elysia, t } from "elysia";
import type { Database } from "bun:sqlite";
import { createHash, timingSafeEqual } from "node:crypto";
import { config } from "../../config";
import { logger } from "../../lib/observability/logger";
import { PlayService } from "./play-service";
import { SubscriptionService } from "./subscription-service";
import { captureProductEvent } from "../../lib/analytics/product-analytics";

type RtdnRouteContext = {
  body?: {
    message?: {
      data?: string;
      messageId?: string;
      publishTime?: string;
    };
    subscription?: string;
  };
  params: { secret: string };
  db: Database;
  set: { status?: number };
};

/**
 * The slice of a Real-time Developer Notification we act on. Google sends
 * one-of notification types; anything that is not a subscription change is
 * acknowledged and dropped.
 */
interface DeveloperNotification {
  version?: string;
  packageName?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  testNotification?: { version?: string };
}

/**
 * Notification types we care about. Every one of them means "go ask Google
 * what this token is worth now", so the number only decides whether to look.
 * See SubscriptionNotification in the Play developer docs.
 */
const SUBSCRIPTION_NOTIFICATION_TYPES = new Set([
  1, // RECOVERED
  2, // RENEWED
  3, // CANCELED
  4, // PURCHASED
  5, // ON_HOLD
  6, // IN_GRACE_PERIOD
  7, // RESTARTED
  10, // PAUSED
  12, // REVOKED
  13, // EXPIRED
]);

/**
 * Google Play RTDN endpoint. Mounted outside auth, like the Stripe webhook.
 *
 * Pub/Sub cannot sign its payloads, so the secret in the path is the only
 * thing proving the caller is our push subscription. The payload is never
 * trusted on its own either: every notification triggers a fresh lookup
 * against Google before any entitlement moves.
 */
export const playWebhookHandler = new Elysia({
  name: "playWebhookHandler",
}).post(
  "/api/billing/play/rtdn/:secret",
  async (rawContext: unknown) => {
    const ctx = rawContext as RtdnRouteContext;

    if (!PlayService.isEnabled()) {
      ctx.set.status = 404;
      return { received: false, error: "Google Play billing is not enabled" };
    }

    const expectedSecret = config.GOOGLE_PLAY_RTDN_SECRET;
    const secretMatches =
      !!expectedSecret &&
      timingSafeEqual(
        createHash("sha256").update(ctx.params.secret).digest(),
        createHash("sha256").update(expectedSecret).digest(),
      );
    if (!secretMatches) {
      logger.warn(
        { operation: "play_rtdn" },
        "Rejected a Play notification with a bad endpoint secret",
      );
      ctx.set.status = 403;
      return { received: false, error: "Forbidden" };
    }

    const messageId = ctx.body?.message?.messageId;
    const data = ctx.body?.message?.data;

    if (!messageId || !data) {
      // Returning 400 makes Pub/Sub retry a message we can never parse, so
      // accept and drop it instead.
      logger.warn(
        { operation: "play_rtdn" },
        "Play notification arrived without a message id or payload",
      );
      return { received: true, skipped: "malformed" };
    }

    // Pub/Sub delivers at least once. Two copies of a renewal are harmless
    // because the handler is idempotent, but the dedupe keeps the log clean
    // and saves a Google round trip.
    const alreadySeen = ctx.db
      .prepare("SELECT 1 FROM play_billing_events WHERE id = ?")
      .get(messageId);
    if (alreadySeen) {
      logger.info(
        { operation: "play_rtdn", messageId },
        "Duplicate Play notification, skipping",
      );
      return { received: true, duplicate: true, messageId };
    }

    let notification: DeveloperNotification;
    try {
      notification = JSON.parse(
        Buffer.from(data, "base64").toString("utf8"),
      ) as DeveloperNotification;
    } catch (error) {
      logger.error(
        { operation: "play_rtdn", messageId, error },
        "Could not decode a Play notification payload",
      );
      return { received: true, skipped: "undecodable" };
    }

    if (notification.testNotification) {
      logger.info(
        { operation: "play_rtdn", messageId },
        "Play test notification received, configuration works",
      );
      ctx.db
        .prepare("INSERT INTO play_billing_events (id) VALUES (?)")
        .run(messageId);
      return { received: true, test: true };
    }

    const subscriptionNotification = notification.subscriptionNotification;
    const purchaseToken = subscriptionNotification?.purchaseToken;
    const notificationType = subscriptionNotification?.notificationType;

    if (
      !purchaseToken ||
      notificationType === undefined ||
      !SUBSCRIPTION_NOTIFICATION_TYPES.has(notificationType)
    ) {
      logger.info(
        { operation: "play_rtdn", messageId, notificationType },
        "Play notification is not a subscription change we act on",
      );
      ctx.db
        .prepare("INSERT INTO play_billing_events (id) VALUES (?)")
        .run(messageId);
      return { received: true, skipped: "unhandled_type" };
    }

    try {
      await applyPlayNotification(ctx.db, purchaseToken, notificationType);
      ctx.db
        .prepare("INSERT INTO play_billing_events (id) VALUES (?)")
        .run(messageId);
      return { received: true, messageId, notificationType };
    } catch (error) {
      logger.error(
        {
          operation: "play_rtdn",
          messageId,
          notificationType,
          error: error instanceof Error ? error : new Error(String(error)),
        },
        "Failed to apply a Play notification",
      );
      // Leave the message unrecorded and fail loudly so Pub/Sub retries.
      ctx.set.status = 500;
      return { received: false, error: "Processing failed" };
    }
  },
  {
    params: t.Object({ secret: t.String() }),
    body: t.Object({
      message: t.Optional(
        t.Object({
          data: t.Optional(t.String()),
          messageId: t.Optional(t.String()),
          publishTime: t.Optional(t.String()),
        }),
      ),
      subscription: t.Optional(t.String()),
    }),
    detail: {
      summary: "Handle Google Play Real-time Developer Notifications (NO AUTH)",
      tags: ["Billing"],
    },
  },
);

/**
 * Re-read the purchase from Google and move the local record to match.
 *
 * The purchase token is the join key. It survives renewals, which is why a
 * renewal needs no special case, and it changes on resubscribe, which is what
 * linkedPurchaseToken exists to tell us.
 */
async function applyPlayNotification(
  db: Database,
  purchaseToken: string,
  notificationType: number,
): Promise<void> {
  const purchase = await PlayService.getSubscription(purchaseToken);

  // Find the account this purchase belongs to. A brand new token arrives here
  // only if the app never reached our verify endpoint, in which case the
  // linked token from the previous subscription is the way back to the user.
  let owner = db
    .prepare(
      "SELECT user_id FROM subscriptions WHERE provider = 'play' AND provider_subscription_id = ?",
    )
    .get(purchaseToken) as { user_id: number } | undefined;

  if (!owner && purchase.linkedPurchaseToken) {
    owner = db
      .prepare(
        "SELECT user_id FROM subscriptions WHERE provider = 'play' AND provider_subscription_id = ?",
      )
      .get(purchase.linkedPurchaseToken) as { user_id: number } | undefined;
  }

  // Last resort, and the one that covers a purchase the app never claimed:
  // the account token passed at purchase time, echoed back by Play. Without
  // this, a payment whose verify call failed stays unattached until the app
  // next opens.
  if (!owner && purchase.obfuscatedAccountId) {
    const userId = await SubscriptionService.findUserByPlayAccountToken(
      purchase.obfuscatedAccountId,
    );

    if (userId !== null) {
      owner = { user_id: userId };
      logger.info(
        { operation: "play_rtdn", userId, notificationType },
        "Matched a Play purchase to its account by account token",
      );
    }
  }

  if (!owner) {
    logger.warn(
      { operation: "play_rtdn", notificationType },
      "No account matches this Play purchase token yet, leaving it for the app to claim",
    );
    return;
  }

  // A replacement purchase supersedes the old token. Retire it so a stale row
  // cannot keep an expired subscription alive.
  if (purchase.linkedPurchaseToken) {
    await SubscriptionService.cancelSubscription(
      owner.user_id,
      "play",
      purchase.linkedPurchaseToken,
    );
  }

  await SubscriptionService.upsertSubscription(
    owner.user_id,
    "play",
    purchaseToken,
    purchase.status,
    purchase.currentPeriodEnd,
  );

  if (notificationType === 13 || notificationType === 12) {
    void captureProductEvent({
      distinctId: owner.user_id,
      event: "subscription_canceled",
      properties: { plan: purchase.plan },
    });
  }

  logger.info(
    {
      operation: "play_rtdn_processed",
      userId: owner.user_id,
      notificationType,
      status: purchase.status,
    },
    "Applied Play notification",
  );
}
