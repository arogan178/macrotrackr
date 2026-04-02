// src/modules/billing/schemas.ts
import { t } from "elysia";

const subscriptionStatusSchema = t.Union([
  t.Literal("active"),
  t.Literal("canceled"),
  t.Literal("past_due"),
  t.Literal("unpaid"),
]);

const subscriptionIntervalSchema = t.Union([
  t.Literal("month"),
  t.Literal("year"),
]);

export const BillingSchemas = {
  // Create checkout session request
  createCheckoutSession: t.Object({
    successUrl: t.String({ format: "uri" }),
    cancelUrl: t.String({ format: "uri" }),
    metadata: t.Optional(t.Record(t.String(), t.String())),
  }),

  // Create customer portal session request
  createPortalSession: t.Object({
    returnUrl: t.String({ format: "uri" }),
  }),

  // Webhook event (minimal validation for security)
  webhookEvent: t.Object({
    type: t.String(),
    data: t.Object({
      object: t.Any(),
    }),
    id: t.String(),
    created: t.Number(),
  }),

  // Subscription status update
  subscriptionStatus: t.Object({
    status: subscriptionStatusSchema,
    currentPeriodEnd: t.String({ format: "date-time" }),
  }),

  // Get subscription response
  subscriptionResponse: t.Object({
    id: t.String(),
    status: subscriptionStatusSchema,
    customerId: t.String(),
    currentPeriodStart: t.String({ format: "date-time" }),
    currentPeriodEnd: t.String({ format: "date-time" }),
    cancelAtPeriodEnd: t.Boolean(),
    created: t.String({ format: "date-time" }),
    priceId: t.String(),
  }),

  // Checkout session response
  checkoutSessionResponse: t.Object({
    sessionId: t.String(),
    url: t.String({ format: "uri" }),
  }),

  // Customer portal session response
  portalSessionResponse: t.Object({
    url: t.String({ format: "uri" }),
  }),

  // Subscription plan information
  subscriptionPlan: t.Object({
    id: t.String(),
    name: t.String(),
    description: t.String(),
    price: t.Number(),
    currency: t.String(),
    interval: subscriptionIntervalSchema,
    features: t.Array(t.String()),
  }),
} as const;

export interface CreateCheckoutSessionRequest {
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreatePortalSessionRequest {
  returnUrl: string;
}

export interface WebhookEventRequest {
  type: string;
  data: {
    object: unknown;
  };
  id: string;
  created: number;
}

export interface SubscriptionStatusRequest {
  status: "active" | "canceled" | "past_due" | "unpaid";
  currentPeriodEnd: string;
}

export interface SubscriptionResponse {
  id: string;
  status: "active" | "canceled" | "past_due" | "unpaid";
  customerId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  created: string;
  priceId: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}
