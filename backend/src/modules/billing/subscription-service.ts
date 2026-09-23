// src/modules/billing/subscription-service.ts

import type { Database } from "bun:sqlite";
import type Stripe from "stripe";
import { logger } from "../../lib/observability/logger";
import { safeQuery, safeExecute, withTransaction } from "../../lib/data/database";
import { NotFoundError } from "../../lib/http/errors";
import { generateId } from "../../utils/id-generator";
import { handleServiceError } from "../../lib/http/error-handler";
import type { CacheService } from "../../services/cache-service";
import type { BillingProvider } from "@shared/entitlements";

export type ProviderSubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid";

export interface SubscriptionRecord {
  id: string;
  user_id: number;
  provider: BillingProvider;
  provider_subscription_id: string;
  status: ProviderSubscriptionStatus;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionInfo {
  subscription_status: "free" | "pro" | "canceled";
  stripe_customer_id: string | null;
  subscription?: SubscriptionRecord;
  price?: string;
  paymentMethod?: { brand: string; last4: string };
  stripeDetails?: Stripe.Subscription;
}

interface CachedStripeDetails {
  price?: string;
  paymentMethod?: { brand: string; last4: string };
  stripeDetails?: Stripe.Subscription;
}

let dbRef: Database | null = null;
let cacheServiceRef: CacheService | null = null;

export function configureSubscriptionService(options: {
  db: Database;
  cacheService: CacheService;
}) {
  dbRef = options.db;
  cacheServiceRef = options.cacheService;
}

function getDb(): Database {
  if (!dbRef) {
    throw new Error("SubscriptionService database is not configured");
  }

  return dbRef;
}

function getCacheService(): CacheService {
  if (!cacheServiceRef) {
    throw new Error("SubscriptionService cache service is not configured");
  }

  return cacheServiceRef;
}

const stripeDetailsCacheKey = (providerSubscriptionId: string) =>
  `stripe-details:${providerSubscriptionId}`;

export class SubscriptionService {
  /**
   * Drop the cached Stripe view of a subscription so the next read sees a
   * change made in Stripe, such as a pending cancellation.
   */
  static forgetStripeDetails(providerSubscriptionId: string): void {
    getCacheService().delete(stripeDetailsCacheKey(providerSubscriptionId));
  }

  /**
   * Create or update a subscription record
   */
  static async upsertSubscription(
    userId: number,
    provider: BillingProvider,
    providerSubscriptionId: string,
    status: ProviderSubscriptionStatus,
    currentPeriodEnd: string
  ): Promise<SubscriptionRecord> {
    const db = getDb();
    return withTransaction(db, () => {
      try {
        const existing = safeQuery<SubscriptionRecord>(
          db,
          "SELECT * FROM subscriptions WHERE provider = ? AND provider_subscription_id = ?",
          [provider, providerSubscriptionId]
        );
        if (existing) {
          safeExecute(
            db,
            `UPDATE subscriptions 
             SET status = ?, current_period_end = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE provider = ? AND provider_subscription_id = ?`,
            [status, currentPeriodEnd, provider, providerSubscriptionId]
          );
          logger.info(
            {
              operation: "update_subscription",
              userId,
              provider,
              subscriptionId: providerSubscriptionId,
              status,
            },
            "Updated subscription record"
          );
        } else {
          const subscriptionId = generateId();
          safeExecute(
            db,
            `INSERT INTO subscriptions (id, user_id, provider, provider_subscription_id, status, current_period_end)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              subscriptionId,
              userId,
              provider,
              providerSubscriptionId,
              status,
              currentPeriodEnd,
            ]
          );
          logger.info(
            {
              operation: "create_subscription",
              userId,
              provider,
              subscriptionId: providerSubscriptionId,
              status,
            },
            "Created subscription record"
          );
        }
        const userStatus =
          status === "active" ? "pro"
          : status === "canceled" ? "canceled"
          : "free";
        safeExecute(
          db,
          "UPDATE users SET subscription_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [userStatus, userId]
        );
        const updated = safeQuery<SubscriptionRecord>(
          db,
          "SELECT * FROM subscriptions WHERE provider = ? AND provider_subscription_id = ?",
          [provider, providerSubscriptionId]
        );
        if (!updated) {
          throw new NotFoundError("Failed to retrieve updated subscription");
        }
        return updated;
      } catch (error) {
        handleServiceError(
          error,
          "upsert_subscription",
          { userId, provider, subscriptionId: providerSubscriptionId },
          [NotFoundError]
        );
      }
    });
  }

  /**
   * Get user subscription information
   */
  static async getUserSubscription(
    userId: number
  ): Promise<UserSubscriptionInfo> {
    const db = getDb();
    const cacheService = getCacheService();
    try {
      const user = safeQuery<{
        subscription_status: "free" | "pro" | "canceled";
        stripe_customer_id: string | null;
      }>(
        db,
        "SELECT subscription_status, stripe_customer_id FROM users WHERE id = ?",
        [userId]
      );
      if (!user) {
        throw new NotFoundError("User not found");
      }
      const subscription = safeQuery<SubscriptionRecord>(
        db,
        `SELECT * FROM subscriptions 
         WHERE user_id = ? AND status IN ('active', 'past_due') 
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      let price: string | undefined = undefined;
      let paymentMethod: { brand: string; last4: string } | undefined =
        undefined;
      let stripeDetails: Stripe.Subscription | undefined = undefined;

      // Use cache for Stripe details if available
      let cacheKey: string | undefined = undefined;
      if (
        subscription?.provider === "stripe" &&
        subscription.provider_subscription_id
      ) {
        cacheKey = stripeDetailsCacheKey(subscription.provider_subscription_id);
        const cached = cacheService.get<CachedStripeDetails>(cacheKey);
        if (cached) {
          price = cached.price;
          paymentMethod = cached.paymentMethod;
          stripeDetails = cached.stripeDetails;
        } else {
          try {
            const details = await (
              await import("./stripe-service")
            ).StripeService.getSubscriptionWithDetails(
              subscription.provider_subscription_id
            );
            price = details.price;
            paymentMethod = details.paymentMethod ?? undefined;
            stripeDetails = details.subscription;
            cacheService.set(cacheKey, { price, paymentMethod, stripeDetails });
          } catch (err) {
            logger.error(
              { err },
              "Failed to fetch Stripe subscription details"
            );
          }
        }
      }

      return {
        subscription_status: user.subscription_status,
        stripe_customer_id: user.stripe_customer_id,
        subscription: subscription ?? undefined,
        price,
        paymentMethod,
        stripeDetails,
      };
    } catch (error) {
      handleServiceError(error, "get_user_subscription", { userId }, [
        NotFoundError,
      ]);
    }
  }

  /**
   * Update user's Stripe customer ID
   */
  static async updateStripeCustomerId(
    userId: number,
    customerId: string
  ): Promise<void> {
    const db = getDb();
    try {
      const result = safeExecute(
        db,
        "UPDATE users SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [customerId, userId]
      );
      if (result.changes === 0) {
        throw new NotFoundError("User not found");
      }
      logger.info(
        {
          operation: "update_stripe_customer_id",
          userId,
          customerId,
        },
        "Updated user Stripe customer ID"
      );
    } catch (error) {
      handleServiceError(
        error,
        "update_stripe_customer_id",
        { userId, customerId },
        [NotFoundError]
      );
    }
  }

  /**
   * Cancel user subscription
   */
  static async cancelSubscription(
    userId: number,
    provider: BillingProvider,
    providerSubscriptionId: string
  ): Promise<void> {
    const db = getDb();
    return withTransaction(db, () => {
      try {
        const result = safeExecute(
          db,
          `UPDATE subscriptions 
           SET status = 'canceled', updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ? AND provider = ? AND provider_subscription_id = ?`,
          [userId, provider, providerSubscriptionId]
        );
        if (result.changes === 0) {
          throw new NotFoundError("Subscription not found");
        }
        safeExecute(
          db,
          "UPDATE users SET subscription_status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [userId]
        );
        logger.info(
          {
            operation: "cancel_subscription",
            userId,
            provider,
              subscriptionId: providerSubscriptionId,
          },
          "Canceled user subscription"
        );
      } catch (error) {
        handleServiceError(
          error,
          "cancel_subscription",
          { userId, provider, subscriptionId: providerSubscriptionId },
          [NotFoundError]
        );
      }
    });
  }

  /**
   * The opaque token this account presents to Google Play at purchase time.
   *
   * Play echoes it back on every notification about that purchase, which is
   * what lets an expiry or cancellation find its account even if the app never
   * reached /play/verify. Random rather than derived from the user id, so it
   * carries nothing about the account and cannot be guessed from one.
   *
   * Created on first use and stable afterwards, because a rotating value would
   * orphan purchases made under the old one.
   */
  static async getOrCreatePlayAccountToken(userId: number): Promise<string> {
    const db = getDb();
    try {
      const existing = safeQuery<{ play_obfuscated_account_id: string | null }>(
        db,
        "SELECT play_obfuscated_account_id FROM users WHERE id = ?",
        [userId]
      );

      if (!existing) {
        throw new NotFoundError("User not found");
      }

      if (existing.play_obfuscated_account_id) {
        return existing.play_obfuscated_account_id;
      }

      // 24 bytes as hex is 48 characters, inside Play's 64 character limit.
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      const token = [...bytes]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      safeExecute(
        db,
        `UPDATE users SET play_obfuscated_account_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND play_obfuscated_account_id IS NULL`,
        [token, userId]
      );

      // Re-read rather than returning the generated value: a concurrent call
      // may have won, and both callers must end up with the same token.
      const stored = safeQuery<{ play_obfuscated_account_id: string | null }>(
        db,
        "SELECT play_obfuscated_account_id FROM users WHERE id = ?",
        [userId]
      );

      if (!stored?.play_obfuscated_account_id) {
        throw new NotFoundError("Could not assign a Play account token");
      }

      return stored.play_obfuscated_account_id;
    } catch (error) {
      handleServiceError(error, "get_or_create_play_account_token", { userId }, [
        NotFoundError,
      ]);
    }
  }

  /**
   * The account a Play notification belongs to, found by the token the app
   * passed at purchase time.
   */
  static async findUserByPlayAccountToken(
    accountToken: string
  ): Promise<number | null> {
    const db = getDb();
    try {
      const row = safeQuery<{ id: number }>(
        db,
        "SELECT id FROM users WHERE play_obfuscated_account_id = ?",
        [accountToken]
      );

      return row?.id ?? null;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "find_user_by_play_account_token",
        },
        "Failed to look up a user by Play account token"
      );
      return null;
    }
  }

  /**
   * The subscription currently paying for this account, whichever provider
   * took the money. Used to stop someone buying Pro twice: if they already
   * pay through Play, web checkout must refuse, and the other way round.
   */
  static async getActiveSubscription(
    userId: number
  ): Promise<SubscriptionRecord | null> {
    const db = getDb();
    try {
      const subscription = safeQuery<SubscriptionRecord>(
        db,
        `SELECT * FROM subscriptions
         WHERE user_id = ? AND status IN ('active', 'past_due')
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      return subscription ?? null;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "get_active_subscription",
          userId,
        },
        "Failed to look up active subscription"
      );
      return null;
    }
  }

  /**
   * Re-read a subscription from the provider that bills it.
   *
   * A renewal only reaches us as a webhook, so a single missed delivery would
   * otherwise hold a paying account on free limits until the next one arrives.
   */
  private static async refreshFromProvider(
    subscription: SubscriptionRecord
  ): Promise<SubscriptionRecord | null> {
    const cacheService = getCacheService();
    const throttleKey = `subscription-refresh:${subscription.provider}:${subscription.provider_subscription_id}`;

    // Without this, a provider outage means one lookup per gated request.
    if (cacheService.get(throttleKey)) {
      return null;
    }
    cacheService.set(throttleKey, true);

    try {
      let fresh: {
        status: ProviderSubscriptionStatus;
        currentPeriodEnd: string;
      } | null;

      if (subscription.provider === "play") {
        const { PlayService } = await import("./play-service");
        fresh = await PlayService.getSubscription(
          subscription.provider_subscription_id
        );
      } else {
        const { StripeService, normalizeStripeSubscription } = await import(
          "./stripe-service"
        );
        fresh = normalizeStripeSubscription(
          await StripeService.getSubscription(
            subscription.provider_subscription_id
          )
        );
      }

      if (!fresh) {
        return null;
      }

      logger.info(
        {
          operation: "refresh_subscription_from_provider",
          userId: subscription.user_id,
          provider: subscription.provider,
          subscriptionId: subscription.provider_subscription_id,
          status: fresh.status,
          currentPeriodEnd: fresh.currentPeriodEnd,
        },
        "Refreshed a stale subscription from its provider"
      );

      return await SubscriptionService.upsertSubscription(
        subscription.user_id,
        subscription.provider,
        subscription.provider_subscription_id,
        fresh.status,
        fresh.currentPeriodEnd
      );
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "refresh_subscription_from_provider",
          userId: subscription.user_id,
          provider: subscription.provider,
          subscriptionId: subscription.provider_subscription_id,
        },
        "Failed to refresh subscription from its provider"
      );
      return null;
    }
  }

  /**
   * Check if user has active Pro subscription
   */
  static async hasActiveProSubscription(userId: number): Promise<boolean> {
    const db = getDb();
    try {
      const subscription = safeQuery<SubscriptionRecord>(
        db,
        `SELECT * FROM subscriptions
         WHERE user_id = ? AND status = 'active'`,
        [userId]
      );

      if (!subscription) {
        logger.debug(
          { operation: "check_active_pro_subscription", userId },
          "No active subscription found for user"
        );
        return false;
      }

      const now = new Date();

      if (new Date(subscription.current_period_end) > now) {
        return true;
      }

      const refreshed = await SubscriptionService.refreshFromProvider(
        subscription
      );

      return (
        refreshed?.status === "active" &&
        new Date(refreshed.current_period_end) > now
      );
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "check_active_pro_subscription",
          userId,
        },
        "Failed to check Pro subscription status"
      );
      return false; // Default to false on error for safety
    }
  }
}
