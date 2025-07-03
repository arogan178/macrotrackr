// src/modules/billing/subscription-service.ts

import { db } from "../../db";
import { logger } from "../../lib/logger";
import { safeQuery, safeExecute, withTransaction } from "../../lib/database";
import { NotFoundError } from "../../lib/errors";
import { generateId } from "../../utils/id-generator";
import { handleServiceError } from "../../lib/error-handler";

export interface SubscriptionRecord {
  id: string;
  user_id: number;
  stripe_subscription_id: string;
  status: "active" | "canceled" | "past_due" | "unpaid";
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionInfo {
  subscription_status: "free" | "pro" | "canceled";
  stripe_customer_id: string | null;
  subscription?: SubscriptionRecord;
}

export class SubscriptionService {
  /**
   * Create or update a subscription record
   */
  static async upsertSubscription(
    userId: number,
    stripeSubscriptionId: string,
    status: "active" | "canceled" | "past_due" | "unpaid",
    currentPeriodEnd: string
  ): Promise<SubscriptionRecord> {
    return withTransaction(db, () => {
      try {
        const existing = safeQuery<SubscriptionRecord>(
          db,
          "SELECT * FROM subscriptions WHERE stripe_subscription_id = ?",
          [stripeSubscriptionId]
        );
        if (existing) {
          safeExecute(
            db,
            `UPDATE subscriptions 
             SET status = ?, current_period_end = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE stripe_subscription_id = ?`,
            [status, currentPeriodEnd, stripeSubscriptionId]
          );
          logger.info(
            {
              operation: "update_subscription",
              userId,
              subscriptionId: stripeSubscriptionId,
              status,
            },
            "Updated subscription record"
          );
        } else {
          const subscriptionId = generateId();
          safeExecute(
            db,
            `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, status, current_period_end)
             VALUES (?, ?, ?, ?, ?)`,
            [
              subscriptionId,
              userId,
              stripeSubscriptionId,
              status,
              currentPeriodEnd,
            ]
          );
          logger.info(
            {
              operation: "create_subscription",
              userId,
              subscriptionId: stripeSubscriptionId,
              status,
            },
            "Created subscription record"
          );
        }
        const userStatus =
          status === "active"
            ? "pro"
            : status === "canceled"
            ? "canceled"
            : "free";
        safeExecute(
          db,
          "UPDATE users SET subscription_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [userStatus, userId]
        );
        const updated = safeQuery<SubscriptionRecord>(
          db,
          "SELECT * FROM subscriptions WHERE stripe_subscription_id = ?",
          [stripeSubscriptionId]
        );
        if (!updated) {
          throw new NotFoundError("Failed to retrieve updated subscription");
        }
        return updated;
      } catch (error) {
        handleServiceError(
          error,
          "upsert_subscription",
          { userId, subscriptionId: stripeSubscriptionId },
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
      logger.debug(
        {
          operation: "get_user_subscription",
          userId,
          subscriptionStatus: user.subscription_status,
          hasActiveSubscription: !!subscription,
        },
        "Retrieved user subscription info"
      );
      return {
        subscription_status: user.subscription_status,
        stripe_customer_id: user.stripe_customer_id,
        subscription: subscription || undefined,
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
    stripeSubscriptionId: string
  ): Promise<void> {
    return withTransaction(db, () => {
      try {
        const result = safeExecute(
          db,
          `UPDATE subscriptions 
           SET status = 'canceled', updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ? AND stripe_subscription_id = ?`,
          [userId, stripeSubscriptionId]
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
            subscriptionId: stripeSubscriptionId,
          },
          "Canceled user subscription"
        );
      } catch (error) {
        handleServiceError(
          error,
          "cancel_subscription",
          { userId, subscriptionId: stripeSubscriptionId },
          [NotFoundError]
        );
      }
    });
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  static async getSubscriptionByStripeId(
    stripeSubscriptionId: string
  ): Promise<SubscriptionRecord> {
    try {
      const subscription = safeQuery<SubscriptionRecord>(
        db,
        "SELECT * FROM subscriptions WHERE stripe_subscription_id = ?",
        [stripeSubscriptionId]
      );
      if (!subscription) {
        throw new NotFoundError("Subscription not found");
      }
      return subscription;
    } catch (error) {
      handleServiceError(
        error,
        "get_subscription_by_stripe_id",
        { stripeSubscriptionId },
        [NotFoundError]
      );
    }
  }

  /**
   * Check if user has active Pro subscription
   */
  static async hasActiveProSubscription(userId: number): Promise<boolean> {
    try {
      const subscription = safeQuery<{ count: number }>(
        db,
        `SELECT COUNT(*) as count FROM subscriptions 
         WHERE user_id = ? AND status = 'active' AND datetime(current_period_end) > datetime('now')`,
        [userId]
      );

      const hasActive = (subscription?.count || 0) > 0;

      logger.debug(
        {
          operation: "check_active_pro_subscription",
          userId,
          hasActive,
        },
        "Checked user Pro subscription status"
      );

      return hasActive;
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
