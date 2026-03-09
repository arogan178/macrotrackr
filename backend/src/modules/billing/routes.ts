// src/modules/billing/routes.ts

import { Elysia } from "elysia";
import { db } from "../../db";
import { logger } from "../../lib/logger";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import { StripeService } from "./stripe-service";
import { SubscriptionService } from "./subscription-service";
import { getPlans } from "../../config/pricing";
import { t } from "elysia";
import type { AuthenticatedRouteContext } from "../../types";
import { resolveAuthenticatedUser } from "../../lib/route-adapter";

type BillingRouteContext = AuthenticatedRouteContext<Record<string, unknown>>;

// Response schemas for type safety and API documentation
const SubscriptionInfoSchema = t.Object({
  id: t.String(),
  status: t.String(),
  currentPeriodEnd: t.Nullable(t.String()),
  stripeSubscriptionId: t.Nullable(t.String()),
});

const BillingDetailsResponseSchema = t.Object({
  subscription: t.Nullable(SubscriptionInfoSchema),
  price: t.Nullable(t.String()),
  paymentMethod: t.Nullable(
    t.Object({
      brand: t.String(),
      last4: t.String(),
    })
  ),
  stripeDetails: t.Nullable(t.Any()),
});

const CancelResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

const CheckoutResponseSchema = t.Object({
  sessionId: t.String(),
  url: t.String(),
});

const PortalResponseSchema = t.Object({
  url: t.String(),
});

const SubscriptionStatusResponseSchema = t.Object({
  status: t.String(),
  hasStripeCustomer: t.Boolean(),
  subscription: t.Nullable(SubscriptionInfoSchema),
});

const PlanSchema = t.Object({
  id: t.Union([t.Literal("free"), t.Literal("pro")]),
  name: t.String(),
  description: t.String(),
  price: t.Number(),
  currency: t.String(),
  interval: t.Union([t.Literal("month"), t.Literal("year")]),
  features: t.Array(t.String()),
});

const PlansResponseSchema = t.Object({
  plans: t.Array(PlanSchema),
});

// Helper for consistent error logging and user-friendly error throwing
// Returns `never` to indicate it always throws
function handleRouteError(error: unknown, operation: string, userId?: number): never {
  logger.error(
    {
      error: error instanceof Error ? error : new Error(String(error)),
      operation,
      userId,
    },
    `Failed to ${operation.replace(/_/g, " ")}`
  );
  if (error instanceof BadRequestError || error instanceof NotFoundError) {
    throw error;
  }
  throw new BadRequestError(
    "An unexpected error occurred. Please try again later."
  );
}

function resolveBillingUser(context: BillingRouteContext) {
  const authenticatedUser = resolveAuthenticatedUser(context);
  const clerkUser = context.user;

  return {
    userId: authenticatedUser.userId,
    email: authenticatedUser.email || "",
    firstName: authenticatedUser.firstName || clerkUser?.firstName || "",
    lastName: authenticatedUser.lastName || clerkUser?.lastName || "",
  };
}

export const billingRoutes = (app: Elysia) =>
  app.group("/api/billing", (group) =>
    group
      .decorate("db", db)

      // Get detailed billing/subscription info
      .get(
        "/details",
        async (context: any) => {
          const user = resolveBillingUser(context as BillingRouteContext);
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
          response: BillingDetailsResponseSchema,
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
        async (context: any) => {
          const user = resolveBillingUser(context as BillingRouteContext);
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
          response: CancelResponseSchema,
          detail: {
            summary: "Cancel the current user's subscription",
            tags: ["Billing"],
          },
        }
      )
      .post(
        "/checkout",
        async (context: any) => {
          const { body } = context as { body?: Record<string, unknown> };
          const user = resolveBillingUser(context as BillingRouteContext);
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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bodyData = body as any;

            // Determine price ID based on plan
            const plan = bodyData?.plan === "yearly" ? "yearly" : "monthly";
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
              successUrl: bodyData?.successUrl,
              cancelUrl: bodyData?.cancelUrl,
              priceId,
              metadata: {
                userId: user.userId.toString(),
                plan,
                ...bodyData?.metadata,
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
          response: CheckoutResponseSchema,
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
        async (context: any) => {
          const { body } = context as { body?: Record<string, unknown> };
          const user = resolveBillingUser(context as BillingRouteContext);
          try {
            const userSubscription =
              await SubscriptionService.getUserSubscription(user.userId);
            if (!userSubscription.stripe_customer_id) {
              throw new BadRequestError("User has no Stripe customer ID");
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const returnUrl = (body as any)?.returnUrl;
            if (!returnUrl) {
              throw new BadRequestError("Return URL is required");
            }

            const portalSession =
              await StripeService.createCustomerPortalSession(
                userSubscription.stripe_customer_id,
                returnUrl
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
          response: PortalResponseSchema,
          detail: {
            summary: "Create Stripe customer portal session",
            tags: ["Billing"],
          },
        }
      )

      // Get current subscription status
      .get(
        "/subscription",
        async (context: any) => {
          const user = resolveBillingUser(context as BillingRouteContext);
          try {
            const subscriptionInfo =
              await SubscriptionService.getUserSubscription(user.userId);
            return {
              status: subscriptionInfo.subscription_status,
              hasStripeCustomer: !!subscriptionInfo.stripe_customer_id,
              subscription: subscriptionInfo.subscription ? {
                id: subscriptionInfo.subscription.id,
                status: subscriptionInfo.subscription.status,
                currentPeriodEnd: subscriptionInfo.subscription.current_period_end,
                stripeSubscriptionId: subscriptionInfo.subscription.stripe_subscription_id,
              } : null,
            };
          } catch (error) {
            handleRouteError(error, "get_subscription_status", user?.userId);
          }
        },
        {
          response: SubscriptionStatusResponseSchema,
          detail: {
            summary: "Get the current user's subscription status",
            tags: ["Billing"],
          },
        }
      )

      // Get available plans
      .get(
        "/plans",
        async () => {
          try {
            const plans = getPlans().map(plan => ({
              ...plan,
              features: [...plan.features]
            }));
            return { plans };
          } catch (error) {
            handleRouteError(error, "get_plans");
          }
        },
        {
          response: PlansResponseSchema,
          detail: {
            summary: "Get available subscription plans",
            tags: ["Billing"],
          },
        }
      )
  );
