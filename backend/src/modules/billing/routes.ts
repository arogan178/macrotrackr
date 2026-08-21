// src/modules/billing/routes.ts

import { Elysia } from "elysia";
import { logger } from "../../lib/observability/logger";
import { BadRequestError, NotFoundError } from "../../lib/http/errors";
import { StripeService } from "./stripe-service";
import { PlayService } from "./play-service";
import { config } from "../../config";
import { SubscriptionService } from "./subscription-service";
import { PLANS } from "../../config/pricing";
import { t } from "elysia";
import type { AuthenticatedRouteContextWithUser } from "../../types";
import { captureProductEvent } from "../../lib/analytics/product-analytics";

// Response schemas for type safety and API documentation
const SubscriptionInfoSchema = t.Object({
  id: t.String(),
  status: t.String(),
  currentPeriodEnd: t.Nullable(t.String()),
  provider: t.Union([t.Literal("stripe"), t.Literal("play")]),
  providerSubscriptionId: t.Nullable(t.String()),
});

const BillingDetailsResponseSchema = t.Object({
  subscription: t.Nullable(SubscriptionInfoSchema),
  price: t.Nullable(t.String()),
  paymentMethod: t.Nullable(
    t.Object({
      brand: t.String(),
      last4: t.String(),
    }),
  ),
  stripeDetails: t.Nullable(t.Unknown()),
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

const CapabilitiesResponseSchema = t.Object({
  web: t.Boolean(),
  play: t.Boolean(),
});

// Stripe hands the browser back to whatever URL we hand it, so an
// attacker-chosen URL turns the payment flow into a phishing asset. Only
// same-app destinations are allowed.
function isAllowedRedirectUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  const appHostname = new URL(config.APP_URL).hostname;
  if (parsed.hostname === appHostname) {
    return true;
  }

  // ponytail: last-two-labels apex match so the Capacitor webview host
  // (app.macrotrackr.com) passes; swap for a public-suffix lookup if the
  // domain ever moves under a multi-part TLD.
  const labels = appHostname.split(".");
  const apex = labels.slice(-2).join(".");
  return labels.length > 2 && parsed.hostname.endsWith(`.${apex}`);
}

function assertAllowedRedirectUrl(url: string): void {
  if (!isAllowedRedirectUrl(url)) {
    throw new BadRequestError("Redirect URL must point to the application");
  }
}

const PlayAccountTokenResponseSchema = t.Object({
  accountToken: t.String(),
});

const PlayVerifyResponseSchema = t.Object({
  status: t.String(),
  currentPeriodEnd: t.String(),
  entitled: t.Boolean(),
  plan: t.Union([
    t.Literal("monthly"),
    t.Literal("yearly"),
    t.Literal("unknown"),
  ]),
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
function handleRouteError(
  error: unknown,
  operation: string,
  userId?: number,
): never {
  logger.error(
    {
      error: error instanceof Error ? error : new Error(String(error)),
      operation,
      userId,
    },
    `Failed to ${operation.replace(/_/g, " ")}`,
  );
  if (error instanceof BadRequestError || error instanceof NotFoundError) {
    throw error;
  }
  throw new BadRequestError(
    "An unexpected error occurred. Please try again later.",
  );
}

type BillingRouteContext<TBody = Record<string, unknown>> =
  AuthenticatedRouteContextWithUser<TBody>;

type CheckoutRequestBody = {
  plan?: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

type PortalRequestBody = {
  returnUrl: string;
};

type PlayVerifyRequestBody = {
  purchaseToken: string;
};

function resolveBillingUser(context: BillingRouteContext) {
  const authenticatedUser = context.authenticatedUser;
  const userId = authenticatedUser.userId;

  if (!userId) {
    throw new BadRequestError("Authenticated user ID is required");
  }

  return {
    userId,
    email: authenticatedUser.email ?? "",
    firstName: authenticatedUser.firstName ?? "",
    lastName: authenticatedUser.lastName ?? "",
  };
}

export const billingRoutes = (app: Elysia) =>
  app.group("/api/billing", (group) =>
    group
      // Get detailed billing/subscription info
      .get(
        "/details",
        async (rawContext: unknown) => {
          const context = rawContext as BillingRouteContext;
          const user = resolveBillingUser(context);
          try {
            const subscriptionInfo =
              await SubscriptionService.getUserSubscription(user.userId);
            // Compose response as per the plan
            return {
              subscription: subscriptionInfo.subscription
                ? {
                    id: subscriptionInfo.subscription.id,
                    status: subscriptionInfo.subscription.status,
                    currentPeriodEnd:
                      subscriptionInfo.subscription.current_period_end,
                    provider: subscriptionInfo.subscription.provider,
                    providerSubscriptionId:
                      subscriptionInfo.subscription.provider_subscription_id,
                  }
                : null,
              price: subscriptionInfo.price ?? null,
              paymentMethod: subscriptionInfo.paymentMethod ?? null,
              stripeDetails: subscriptionInfo.stripeDetails ?? null,
            };
          } catch (error) {
            handleRouteError(error, "get_billing_details", user.userId);
          }
        },
        {
          response: BillingDetailsResponseSchema,
          detail: {
            summary:
              "Get detailed billing and subscription info for the current user",
            tags: ["Billing"],
          },
        },
      )

      // Cancel current subscription
      .post(
        "/cancel",
        async (rawContext: unknown) => {
          const context = rawContext as BillingRouteContext;
          const user = resolveBillingUser(context);
          try {
            const userSubscription =
              await SubscriptionService.getUserSubscription(user.userId);
            const sub = userSubscription.subscription;
            if (!sub?.provider_subscription_id) {
              throw new BadRequestError("No active subscription to cancel");
            }
            // Google owns the billing relationship for Play purchases, so
            // there is nothing we can cancel server-side. Send the user to
            // the Play subscription screen instead of failing silently.
            if (sub.provider === "play") {
              throw new BadRequestError(
                "This subscription is billed by Google Play. Cancel it in the Play Store under Payments and subscriptions.",
              );
            }
            // Cancel in Stripe
            await StripeService.cancelSubscription(
              sub.provider_subscription_id,
            );
            // Update local DB
            await SubscriptionService.cancelSubscription(
              user.userId,
              "stripe",
              sub.provider_subscription_id,
            );
            logger.info(
              {
                operation: "cancel_subscription",
                userId: user.userId,
                subscriptionId: sub.provider_subscription_id,
              },
              "Canceled user subscription via API",
            );
            return {
              success: true,
              message:
                "Subscription canceled. You will retain access until the end of your billing period.",
            };
          } catch (error) {
            handleRouteError(error, "cancel_subscription", user.userId);
          }
        },
        {
          response: CancelResponseSchema,
          detail: {
            summary: "Cancel the current user's subscription",
            tags: ["Billing"],
          },
        },
      )
      .post(
        "/checkout",
        async (rawContext: unknown) => {
          const context =
            rawContext as BillingRouteContext<CheckoutRequestBody>;
          const { body } = context;
          const user = resolveBillingUser(context);
          try {
            if (!body) {
              throw new BadRequestError("Request body is required");
            }

            const userSubscription =
              await SubscriptionService.getUserSubscription(user.userId);
            if (userSubscription.subscription_status === "pro") {
              // Naming the provider matters here: someone who bought Pro in
              // the Android app cannot cancel it on the web, and a generic
              // "you already have Pro" leaves them with nowhere to go.
              if (userSubscription.subscription?.provider === "play") {
                throw new BadRequestError(
                  "This account already has Pro through Google Play. Manage it in the Play Store under Payments and subscriptions.",
                );
              }
              throw new BadRequestError(
                "User already has an active Pro subscription",
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
                customerId,
              );
            }

            // Determine price ID based on plan
            const plan = body.plan === "yearly" ? "yearly" : "monthly";
            const priceId =
              plan === "yearly"
                ? (process.env.STRIPE_PRICE_ID_YEARLY ?? "")
                : (process.env.STRIPE_PRICE_ID_MONTHLY ?? "");
            if (!priceId)
              throw new BadRequestError(
                "Stripe price ID not configured for selected plan",
              );
            assertAllowedRedirectUrl(body.successUrl);
            assertAllowedRedirectUrl(body.cancelUrl);
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
              "Created checkout session for user",
            );
            void captureProductEvent({
              distinctId: user.userId,
              event: "checkout_started",
              properties: { plan, source: "pricing_page" },
            });
            return { sessionId: session.id, url: session.url! };
          } catch (error) {
            handleRouteError(error, "create_checkout_session", user.userId);
          }
        },
        {
          body: t.Object({
            plan: t.Optional(
              t.Union([t.Literal("monthly"), t.Literal("yearly")]),
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
        },
      )

      // Create customer portal session
      .post(
        "/portal",
        async (rawContext: unknown) => {
          const context = rawContext as BillingRouteContext<PortalRequestBody>;
          const { body } = context;
          const user = resolveBillingUser(context);
          try {
            if (!body) {
              throw new BadRequestError("Request body is required");
            }

            const userSubscription =
              await SubscriptionService.getUserSubscription(user.userId);
            if (!userSubscription.stripe_customer_id) {
              throw new BadRequestError("User has no Stripe customer ID");
            }

            const returnUrl = body.returnUrl;
            if (!returnUrl) {
              throw new BadRequestError("Return URL is required");
            }
            assertAllowedRedirectUrl(returnUrl);

            const portalSession =
              await StripeService.createCustomerPortalSession(
                userSubscription.stripe_customer_id,
                returnUrl,
              );
            logger.info(
              {
                operation: "create_portal_session",
                userId: user.userId,
                customerId: userSubscription.stripe_customer_id,
              },
              "Created customer portal session",
            );
            return { url: portalSession.url };
          } catch (error) {
            handleRouteError(error, "create_portal_session", user.userId);
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
        },
      )

      // Get current subscription status
      .get(
        "/subscription",
        async (rawContext: unknown) => {
          const context = rawContext as BillingRouteContext;
          const user = resolveBillingUser(context);
          try {
            const subscriptionInfo =
              await SubscriptionService.getUserSubscription(user.userId);
            return {
              status: subscriptionInfo.subscription_status,
              hasStripeCustomer: !!subscriptionInfo.stripe_customer_id,
              subscription: subscriptionInfo.subscription
                ? {
                    id: subscriptionInfo.subscription.id,
                    status: subscriptionInfo.subscription.status,
                    currentPeriodEnd:
                      subscriptionInfo.subscription.current_period_end,
                    provider: subscriptionInfo.subscription.provider,
                    providerSubscriptionId:
                      subscriptionInfo.subscription.provider_subscription_id,
                  }
                : null,
            };
          } catch (error) {
            handleRouteError(error, "get_subscription_status", user.userId);
          }
        },
        {
          response: SubscriptionStatusResponseSchema,
          detail: {
            summary: "Get the current user's subscription status",
            tags: ["Billing"],
          },
        },
      )

      // The token this account presents to Play when buying.
      //
      // Play echoes it back on every notification about the purchase, so a
      // renewal or cancellation can find its account even if the app never
      // reached /play/verify. Fetched before opening the purchase sheet.
      .get(
        "/play/account-token",
        async (rawContext: unknown) => {
          const context = rawContext as BillingRouteContext;
          const user = resolveBillingUser(context);
          try {
            if (!PlayService.isEnabled()) {
              throw new BadRequestError("Google Play billing is not enabled");
            }

            const accountToken =
              await SubscriptionService.getOrCreatePlayAccountToken(
                user.userId,
              );

            return { accountToken };
          } catch (error) {
            handleRouteError(error, "get_play_account_token", user.userId);
          }
        },
        {
          response: PlayAccountTokenResponseSchema,
          detail: {
            summary: "Get this account's Google Play account token",
            tags: ["Billing"],
          },
        },
      )

      // Claim a Google Play purchase for the signed-in account.
      //
      // The app sends the purchase token it got from Play Billing and nothing
      // else. Everything that decides entitlement comes from Google, so a
      // forged or replayed body buys nobody anything.
      .post(
        "/play/verify",
        async (rawContext: unknown) => {
          const context =
            rawContext as BillingRouteContext<PlayVerifyRequestBody>;
          const { body } = context;
          const user = resolveBillingUser(context);
          try {
            if (!PlayService.isEnabled()) {
              throw new BadRequestError("Google Play billing is not enabled");
            }

            const purchaseToken = body?.purchaseToken;
            if (!purchaseToken) {
              throw new BadRequestError("purchaseToken is required");
            }

            // Refuse to sell Pro twice. Someone already paying through Stripe
            // must cancel there first, otherwise they are billed on both.
            const existing = await SubscriptionService.getActiveSubscription(
              user.userId,
            );
            if (existing?.provider === "stripe") {
              throw new BadRequestError(
                "This account already has a Pro subscription billed on the web. Cancel that first to move billing to Google Play.",
              );
            }

            // One purchase, one account. Without this a token could be passed
            // around to unlock any number of accounts.
            const claimedBy = context.db
              .prepare(
                "SELECT user_id FROM subscriptions WHERE provider = 'play' AND provider_subscription_id = ?",
              )
              .get(purchaseToken) as { user_id: number } | undefined;
            if (claimedBy && claimedBy.user_id !== user.userId) {
              logger.warn(
                {
                  operation: "play_verify",
                  userId: user.userId,
                  claimedBy: claimedBy.user_id,
                },
                "Play purchase token is already attached to another account",
              );
              throw new BadRequestError(
                "That Google Play purchase is already linked to a different account.",
              );
            }

            const purchase = await PlayService.getSubscription(purchaseToken);

            await SubscriptionService.upsertSubscription(
              user.userId,
              "play",
              purchaseToken,
              purchase.status,
              purchase.currentPeriodEnd,
            );

            // Google refunds unacknowledged purchases after three days.
            if (purchase.needsAcknowledgement && purchase.productId) {
              await PlayService.acknowledge(purchaseToken, purchase.productId);
            }

            const entitled = purchase.status === "active";
            if (entitled) {
              void captureProductEvent({
                distinctId: user.userId,
                event: "subscription_started",
                properties: { plan: purchase.plan },
              });
            }

            logger.info(
              {
                operation: "play_verify",
                userId: user.userId,
                status: purchase.status,
                plan: purchase.plan,
                isTestPurchase: purchase.isTestPurchase,
              },
              "Verified Google Play purchase",
            );

            return {
              status: purchase.status,
              currentPeriodEnd: purchase.currentPeriodEnd,
              entitled,
              plan: purchase.plan,
            };
          } catch (error) {
            handleRouteError(error, "play_verify", user.userId);
          }
        },
        {
          response: PlayVerifyResponseSchema,
          detail: {
            summary: "Verify a Google Play purchase and grant Pro",
            tags: ["Billing"],
          },
        },
      )

      // What this deployment can actually sell, and where.
      //
      // The client cannot work this out alone: it knows which store it is
      // running in, but not whether the server is configured to honour a
      // purchase from it. Selling without asking is how a user pays Google
      // and then gets refused by /play/verify, which is money taken for
      // nothing. No auth, because the pricing page is public.
      .get(
        "/capabilities",
        async () => {
          return {
            web: config.BILLING_MODE === "managed",
            play: config.PLAY_BILLING_MODE === "enabled",
          };
        },
        {
          response: CapabilitiesResponseSchema,
          detail: {
            summary: "Which billing providers this deployment can sell through",
            tags: ["Billing"],
          },
        },
      )

      // Get available plans
      .get(
        "/plans",
        async () => {
          try {
            const plans = PLANS.map((plan) => ({
              ...plan,
              features: [...plan.features],
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
        },
      ),
  );
