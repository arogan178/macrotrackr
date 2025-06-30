// src/modules/billing/stripe-service.ts
import Stripe from "stripe";
import { config } from "../../config";
import { logger } from "../../lib/logger";

// Initialize Stripe with secret key
export const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
  typescript: true,
});

// Types for webhook event normalization
export interface ThinEventRelatedObject {
  id: string;
  type: string;
  url?: string;
}

export interface NormalizedWebhookEvent {
  id: string;
  type: string;
  format: "snapshot" | "thin";
  livemode: boolean;
  created: number | string;
  related_object?: ThinEventRelatedObject | null;
  data?: Stripe.Event.Data | null;
  rawEvent: Stripe.Event | any;
}

export interface CreateCheckoutSessionOptions {
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerOptions {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  /**
   * Create a new Stripe customer
   */
  static async createCustomer(
    options: CreateCustomerOptions
  ): Promise<Stripe.Customer> {
    try {
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
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "stripe_create_customer",
          email: options.email,
        },
        "Failed to create Stripe customer"
      );
      throw error;
    }
  }

  /**
   * Create a checkout session for Pro subscription
   */
  static async createCheckoutSession(
    options: CreateCheckoutSessionOptions
  ): Promise<Stripe.Checkout.Session> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: config.STRIPE_PRICE_ID,
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

      // Add customer information
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
        },
        "Created Stripe checkout session"
      );

      return session;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "stripe_create_checkout_session",
          customerId: options.customerId,
          customerEmail: options.customerEmail,
        },
        "Failed to create Stripe checkout session"
      );
      throw error;
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
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "stripe_create_portal_session",
          customerId,
        },
        "Failed to create Stripe customer portal session"
      );
      throw error;
    }
  }

  /**
   * Retrieve a subscription by ID
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      logger.debug(
        {
          operation: "stripe_get_subscription",
          subscriptionId,
          status: subscription.status,
        },
        "Retrieved Stripe subscription"
      );

      return subscription;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "stripe_get_subscription",
          subscriptionId,
        },
        "Failed to retrieve Stripe subscription"
      );
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
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
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "stripe_cancel_subscription",
          subscriptionId,
        },
        "Failed to cancel Stripe subscription"
      );
      throw error;
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
      const event = await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      );

      // Normalize the event format (handle both snapshot and thin events)
      const normalizedEvent = this.normalizeWebhookEvent(event);

      logger.debug(
        {
          operation: "stripe_verify_webhook",
          eventType: normalizedEvent.type,
          eventId: normalizedEvent.id,
          format: normalizedEvent.format,
        },
        "Verified and normalized Stripe webhook signature"
      );

      return normalizedEvent;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "stripe_verify_webhook",
        },
        "Failed to verify Stripe webhook signature"
      );
      throw error;
    }
  }

  /**
   * Normalize webhook event to handle both Snapshot (v1) and Thin (v2) formats
   */
  private static normalizeWebhookEvent(
    event: Stripe.Event | any
  ): NormalizedWebhookEvent {
    // Check if this is a thin event (v2 format)
    // Thin events have object: "v2.core.event" and related_object property
    if (
      (event as any).object === "v2.core.event" &&
      (event as any).related_object
    ) {
      return {
        id: event.id,
        type: event.type,
        format: "thin",
        livemode: event.livemode,
        created: event.created,
        related_object: (event as any).related_object,
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
      data: (event as Stripe.Event).data,
      rawEvent: event,
    };
  }

  /**
   * Fetch the full object for thin events
   */
  static async fetchRelatedObject(
    relatedObject: ThinEventRelatedObject
  ): Promise<any> {
    try {
      // Extract object type and ID from the related object
      const { type, id } = relatedObject;

      // Map thin event types to Stripe API retrievals
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
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          operation: "fetch_related_object",
          relatedObject,
        },
        "Failed to fetch related object for thin event"
      );
      throw error;
    }
  }
}
