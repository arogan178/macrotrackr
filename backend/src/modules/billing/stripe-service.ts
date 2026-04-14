// src/modules/billing/stripe-service.ts
import Stripe from "stripe";
import { config } from "../../config";
import { logger } from "../../lib/observability/logger";
import { handleServiceError } from "../../lib/http/error-handler";

function createStripeClient() {
  return new Stripe(config.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
    typescript: true,
  });
}

let stripeClientRef: Stripe | null = null;

export function getStripeClient() {
  if (!stripeClientRef) {
    stripeClientRef = createStripeClient();
  }

  return stripeClientRef;
}

export function resetStripeClient() {
  stripeClientRef = null;
}

// Types for webhook event normalization
export type ThinEventRelatedObjectType =
  | "billing.subscription"
  | "subscription"
  | "billing.customer"
  | "customer"
  | "billing.invoice"
  | "invoice"
  | "billing.checkout.session"
  | "checkout.session";

export interface ThinEventRelatedObject {
  id: string;
  type: ThinEventRelatedObjectType | (string & {});
  url?: string;
}

export interface ThinWebhookEvent {
  id: string;
  type: string;
  object: "v2.core.event";
  livemode: boolean;
  created: number | string;
  related_object: ThinEventRelatedObject;
}

type StripeWebhookEvent = Stripe.Event | ThinWebhookEvent;

export type NormalizedWebhookEvent =
  | {
      id: string;
      type: string;
      format: "thin";
      livemode: boolean;
      created: number | string;
      related_object: ThinEventRelatedObject;
      data: null;
      rawEvent: ThinWebhookEvent;
    }
  | {
      id: string;
      type: string;
      format: "snapshot";
      livemode: boolean;
      created: number | string;
      related_object: null;
      data: Stripe.Event.Data;
      rawEvent: Stripe.Event;
    };

export type RelatedStripeObject =
  | Stripe.Subscription
  | Stripe.Customer
  | Stripe.DeletedCustomer
  | Stripe.Invoice
  | Stripe.Checkout.Session;

export interface CreateCheckoutSessionOptions {
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  priceId: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerOptions {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  private static isThinWebhookEvent(
    event: StripeWebhookEvent
  ): event is ThinWebhookEvent {
    const candidate = event as Partial<ThinWebhookEvent>;
    return (
      candidate.object === "v2.core.event" &&
      typeof candidate.related_object === "object" &&
      candidate.related_object !== null
    );
  }

  /**
   * Get subscription with expanded details (price, payment method)
   */
  static async getSubscriptionWithDetails(subscriptionId: string): Promise<{
    subscription: Stripe.Subscription;
    price: string;
    paymentMethod: { brand: string; last4: string } | null;
  }> {
    try {
      const stripe = getStripeClient();
      // Expand default_payment_method and plan.product for full details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method", "plan.product"],
      });

      // Get price string
      let price = "";
      if (subscription.items.data.length > 0) {
        const item = subscription.items.data[0];
        if (
          item &&
          item.price &&
          item.price.unit_amount &&
          item.price.currency
        ) {
          price = `$${(item.price.unit_amount / 100).toFixed(2)}/${item.price.recurring?.interval || "month"}`;
        }
      }

      // Get payment method details from the expanded default_payment_method
      let paymentMethod: { brand: string; last4: string } | null = null;
      if (
        subscription.default_payment_method &&
        typeof subscription.default_payment_method === "object" &&
        "card" in subscription.default_payment_method &&
        subscription.default_payment_method.card
      ) {
        paymentMethod = {
          brand: subscription.default_payment_method.card.brand,
          last4: subscription.default_payment_method.card.last4,
        };
      }

      return { subscription, price, paymentMethod };
    } catch (error) {
      handleServiceError(error, "stripe_get_subscription_with_details", {
        subscriptionId,
      });
    }
  }
  /**
   * Create a new Stripe customer
   */
  static async createCustomer(
    options: CreateCustomerOptions
  ): Promise<Stripe.Customer> {
    try {
      const stripe = getStripeClient();
      const customer = await stripe.customers.create({
        email: options.email,
        name: options.name,
        metadata: options.metadata || {},
      });
      logger.info(
        {
          operation: "stripe_create_customer",
          customerId: customer.id,
          email: options.email,
        },
        "Created Stripe customer"
      );
      return customer;
    } catch (error) {
      handleServiceError(error, "stripe_create_customer", {
        email: options.email,
      });
    }
  }

  /**
   * Create a checkout session for Pro subscription
   */
  static async createCheckoutSession(
    options: CreateCheckoutSessionOptions
  ): Promise<Stripe.Checkout.Session> {
    try {
      const stripe = getStripeClient();
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        allow_promotion_codes: true,
        line_items: [
          {
            price: options.priceId,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: options.metadata || {},
        subscription_data: {
          metadata: options.metadata || {},
        },
      };
      if (options.customerId) {
        sessionParams.customer = options.customerId;
      } else if (options.customerEmail) {
        sessionParams.customer_email = options.customerEmail;
      }
      const session = await stripe.checkout.sessions.create(sessionParams);
      logger.info(
        {
          operation: "stripe_create_checkout_session",
          sessionId: session.id,
          customerId: options.customerId,
          customerEmail: options.customerEmail,
          priceId: options.priceId,
        },
        "Created Stripe checkout session"
      );
      return session;
    } catch (error) {
      handleServiceError(error, "stripe_create_checkout_session", {
        customerId: options.customerId,
        customerEmail: options.customerEmail,
        priceId: options.priceId,
      });
    }
  }

  /**
   * Create a customer portal session for subscription management
   */
  static async createCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const stripe = getStripeClient();
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      logger.info(
        {
          operation: "stripe_create_portal_session",
          customerId,
          sessionId: portalSession.id,
        },
        "Created Stripe customer portal session"
      );
      return portalSession;
    } catch (error) {
      handleServiceError(error, "stripe_create_portal_session", { customerId });
    }
  }

  /**
   * Retrieve a subscription by ID
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      handleServiceError(error, "stripe_get_subscription", { subscriptionId });
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      logger.info(
        {
          operation: "stripe_cancel_subscription",
          subscriptionId,
          status: subscription.status,
        },
        "Canceled Stripe subscription"
      );
      return subscription;
    } catch (error) {
      handleServiceError(error, "stripe_cancel_subscription", {
        subscriptionId,
      });
    }
  }

  /**
   * Verify webhook signature and normalize event format
   */
  static async verifyWebhookSignature(
    payload: string,
    signature: string
  ): Promise<NormalizedWebhookEvent> {
    try {
      const stripe = getStripeClient();

      const event = (await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      )) as StripeWebhookEvent;
      const normalizedEvent = this.normalizeWebhookEvent(event);
      return normalizedEvent;
    } catch (error) {
      logger.error(
        {
          operation: "stripe_verify_webhook",
          error,
          header: signature,
          payload: payload.substring(0, 200) + "...",
        },
        "Failed to stripe verify webhook"
      );
      handleServiceError(error, "stripe_verify_webhook");
    }
  }

  /**
   * Normalize webhook event to handle both Snapshot (v1) and Thin (v2) formats
   */
  private static normalizeWebhookEvent(
    event: StripeWebhookEvent
  ): NormalizedWebhookEvent {
    // Check if this is a thin event (v2 format)
    // Thin events have object: "v2.core.event" and related_object property
    if (this.isThinWebhookEvent(event)) {
      return {
        id: event.id,
        type: event.type,
        format: "thin",
        livemode: event.livemode,
        created: event.created,
        related_object: event.related_object,
        data: null, // Thin events don't contain full object data
        rawEvent: event,
      };
    }

    // This is a snapshot event (v1 format)
    return {
      id: event.id,
      type: event.type,
      format: "snapshot",
      livemode: event.livemode,
      created: event.created,
      related_object: null,
      data: event.data,
      rawEvent: event,
    };
  }

  /**
   * Fetch the full object for thin events
   */
  static async fetchRelatedObject(
    relatedObject: ThinEventRelatedObject
  ): Promise<RelatedStripeObject | null> {
    try {
      const stripe = getStripeClient();
      const { type, id } = relatedObject;
      switch (type) {
        case "billing.subscription":
        case "subscription":
          return await stripe.subscriptions.retrieve(id);
        case "billing.customer":
        case "customer":
          return await stripe.customers.retrieve(id);
        case "billing.invoice":
        case "invoice":
          return await stripe.invoices.retrieve(id);
        case "billing.checkout.session":
        case "checkout.session":
          return await stripe.checkout.sessions.retrieve(id);
        default:
          logger.warn(
            {
              operation: "fetch_related_object",
              type,
              id,
            },
            `Unsupported object type for thin event: ${type}`
          );
          return null;
      }
    } catch (error) {
      handleServiceError(error, "fetch_related_object", { relatedObject });
    }
  }
}
