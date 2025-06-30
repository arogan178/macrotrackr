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
            const session = await StripeService.createCheckoutSession({
              customerId,
              successUrl: body.successUrl,
              cancelUrl: body.cancelUrl,
              metadata: { userId: user.userId.toString(), ...body.metadata },
            });
            logger.info(
              {
                operation: "create_checkout_session",
                userId: user.userId,
                sessionId: session.id,
                customerId,
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
            successUrl: t.String({ format: "uri" }),
            cancelUrl: t.String({ format: "uri" }),
            metadata: t.Optional(t.Record(t.String(), t.String())),
          }),
          detail: {
            summary: "Create Stripe checkout session for Pro subscription",
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
              subscription: subscription.subscription
                ? {
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
