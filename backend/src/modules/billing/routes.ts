// ...existing code...
// src/modules/billing/routes.ts

import { Elysia } from "elysia";
import { db } from "../../db";
import { authMiddleware } from "../../middleware/auth";
import { logger } from "../../lib/logger";
import { BadRequestError } from "../../lib/errors";
import { StripeService } from "./stripe-service";
import { SubscriptionService } from "./subscription-service";
import { t } from "elysia";

// Helper for consistent error logging and user-friendly error throwing
function handleRouteError(error: unknown, operation: string, userId?: number) {
  logger.error(
    {
      error: error instanceof Error ? error : new Error(String(error)),
      operation,
      userId,
    },
    `Failed to ${operation.replace(/_/g, " ")}`
  );
  if (error instanceof BadRequestError) throw error;
  throw new BadRequestError(
    "An unexpected error occurred. Please try again later."
  );
}

export const billingRoutes = (app: Elysia) =>
  app.group("/api/billing", (group) =>
    group
      .decorate("db", db)

      // All routes require authentication
      .use(authMiddleware)

      // Get detailed billing/subscription info
      .get(
        "/details",
        async (context: any) => {
          const { user } = context;
          if (!user) throw new BadRequestError("Authentication required");
          try {
            const subscriptionInfo =
              await SubscriptionService.getUserSubscription(user.userId);
            // Compose response as per the plan
            return {
              subscription:
                subscriptionInfo.subscription ?
                  {
                    id: subscriptionInfo.subscription.id,
                    status: subscriptionInfo.subscription.status,
                    currentPeriodEnd:
                      subscriptionInfo.subscription.current_period_end,
                    stripeSubscriptionId:
                      subscriptionInfo.subscription.stripe_subscription_id,
                  }
                : null,
              price: subscriptionInfo.price || null,
              paymentMethod: subscriptionInfo.paymentMethod || null,
              stripeDetails: subscriptionInfo.stripeDetails || null,
            };
          } catch (error) {
            handleRouteError(error, "get_billing_details", user?.userId);
          }
        },
        {
          detail: {
            summary:
              "Get detailed billing and subscription info for the current user",
            tags: ["Billing"],
          },
        }
      )

      // Cancel current subscription
      .post(
        "/cancel",
        async ({ user }) => {
          if (!user) throw new BadRequestError("Authentication required");
          try {
            const userSubscription =
              await SubscriptionService.getUserSubscription(user.userId);
            const sub = userSubscription.subscription;
            if (!sub || !sub.stripe_subscription_id) {
              throw new BadRequestError("No active subscription to cancel");
            }
            // Cancel in Stripe
            await StripeService.cancelSubscription(sub.stripe_subscription_id);
            // Update local DB
            await SubscriptionService.cancelSubscription(
              user.userId,
              sub.stripe_subscription_id
            );
            logger.info(
              {
                operation: "cancel_subscription",
                userId: user.userId,
                subscriptionId: sub.stripe_subscription_id,
              },
              "Canceled user subscription via API"
            );
            return {
              success: true,
              message:
                "Subscription canceled. You will retain access until the end of your billing period.",
            };
          } catch (error) {
            handleRouteError(error, "cancel_subscription", user?.userId);
          }
        },
        {
          detail: {
            summary: "Cancel the current user's subscription",
            tags: ["Billing"],
          },
        }
      )
      .post(
        "/checkout",
        async ({ body, user }) => {
          if (!user) throw new BadRequestError("Authentication required");
          try {
            const userSubscription =
              await SubscriptionService.getUserSubscription(user.userId);
            if (userSubscription.subscription_status === "pro") {
              throw new BadRequestError(
                "User already has an active Pro subscription"
              );
            }
            let customerId = userSubscription.stripe_customer_id;
            if (!customerId) {
              const customer = await StripeService.createCustomer({
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                metadata: { userId: user.userId.toString() },
              });
              customerId = customer.id;
              await SubscriptionService.updateStripeCustomerId(
                user.userId,
                customerId
              );
            }
            // Determine price ID based on plan
            const plan = body.plan === "yearly" ? "yearly" : "monthly";
            const priceId =
              plan === "yearly" ?
                process.env.STRIPE_PRICE_ID_YEARLY || ""
              : process.env.STRIPE_PRICE_ID_MONTHLY || "";
            if (!priceId)
              throw new BadRequestError(
                "Stripe price ID not configured for selected plan"
              );
            const session = await StripeService.createCheckoutSession({
              customerId,
              successUrl: body.successUrl,
              cancelUrl: body.cancelUrl,
              priceId,
              metadata: {
                userId: user.userId.toString(),
                plan,
                ...body.metadata,
              },
            });
            logger.info(
              {
                operation: "create_checkout_session",
                userId: user.userId,
                sessionId: session.id,
                customerId,
                plan,
              },
              "Created checkout session for user"
            );
            return { sessionId: session.id, url: session.url! };
          } catch (error) {
            handleRouteError(error, "create_checkout_session", user?.userId);
          }
        },
        {
          body: t.Object({
            plan: t.Optional(
              t.Union([t.Literal("monthly"), t.Literal("yearly")])
            ),
            successUrl: t.String({ format: "uri" }),
            cancelUrl: t.String({ format: "uri" }),
            metadata: t.Optional(t.Record(t.String(), t.String())),
          }),
          detail: {
            summary:
              "Create Stripe checkout session for Pro subscription (monthly or yearly)",
            tags: ["Billing"],
          },
        }
      )

      // Create customer portal session
      .post(
        "/portal",
        async ({ body, user }) => {
          if (!user) throw new BadRequestError("Authentication required");
          try {
            const userSubscription =
              await SubscriptionService.getUserSubscription(user.userId);
            if (!userSubscription.stripe_customer_id) {
              throw new BadRequestError("User has no Stripe customer ID");
            }
            const portalSession =
              await StripeService.createCustomerPortalSession(
                userSubscription.stripe_customer_id,
                body.returnUrl
              );
            logger.info(
              {
                operation: "create_portal_session",
                userId: user.userId,
                customerId: userSubscription.stripe_customer_id,
              },
              "Created customer portal session"
            );
            return { url: portalSession.url };
          } catch (error) {
            handleRouteError(error, "create_portal_session", user?.userId);
          }
        },
        {
          body: t.Object({
            returnUrl: t.String({ format: "uri" }),
          }),
          detail: {
            summary: "Create Stripe customer portal session",
            tags: ["Billing"],
          },
        }
      )

      // Get current subscription status
      .get(
        "/subscription",
        async ({ user }) => {
          if (!user) throw new BadRequestError("Authentication required");
          try {
            const subscription = await SubscriptionService.getUserSubscription(
              user.userId
            );
            logger.debug(
              {
                operation: "get_subscription_status",
                userId: user.userId,
                status: subscription.subscription_status,
              },
              "Retrieved user subscription status"
            );
            return {
              status: subscription.subscription_status,
              hasStripeCustomer: !!subscription.stripe_customer_id,
              subscription:
                subscription.subscription ?
                  {
                    id: subscription.subscription.id,
                    status: subscription.subscription.status,
                    currentPeriodEnd:
                      subscription.subscription.current_period_end,
                    stripeSubscriptionId:
                      subscription.subscription.stripe_subscription_id,
                  }
                : null,
            };
          } catch (error) {
            handleRouteError(error, "get_subscription_status", user?.userId);
          }
        },
        {
          detail: {
            summary: "Get current subscription status",
            tags: ["Billing"],
          },
        }
      )

      // Get subscription plans
      .get(
        "/plans",
        async () => {
          // Return static plan information
          return {
            plans: [
              {
                id: "free",
                name: "Free",
                description: "Basic macro tracking with essential features",
                price: 0,
                currency: "usd",
                interval: "month" as const,
                features: [
                  "Track daily macros",
                  "Basic meal logging",
                  "Weight tracking",
                  "Simple progress charts",
                  "Up to 3 goals",
                  "Basic habit tracking",
                ],
              },
              {
                id: "pro",
                name: "Pro",
                description:
                  "Advanced features for serious fitness enthusiasts",
                price: 5,
                currency: "usd",
                interval: "month" as const,
                features: [
                  "Everything in Free",
                  "Unlimited goals and habits",
                  "Advanced analytics and insights",
                  "Custom meal templates",
                  "Progress photos",
                  "Data export",
                  "Priority support",
                  "Advanced reporting",
                ],
              },
            ],
          };
        },
        {
          detail: {
            summary: "Get available subscription plans",
            tags: ["Billing"],
          },
        }
      )
  );
