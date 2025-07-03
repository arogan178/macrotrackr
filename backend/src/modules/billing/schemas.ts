// src/modules/billing/schemas.ts
import { z } from "zod";

export const BillingSchemas = {
  // Create checkout session request
  createCheckoutSession: z.object({
    successUrl: z.string().url("Success URL must be a valid URL"),
    cancelUrl: z.string().url("Cancel URL must be a valid URL"),
    metadata: z.record(z.string()).optional(),
  }),

  // Create customer portal session request
  createPortalSession: z.object({
    returnUrl: z.string().url("Return URL must be a valid URL"),
  }),

  // Webhook event (minimal validation for security)
  webhookEvent: z.object({
    type: z.string(),
    data: z.object({
      object: z.any(),
    }),
    id: z.string(),
    created: z.number(),
  }),

  // Subscription status update
  subscriptionStatus: z.object({
    status: z.enum(["active", "canceled", "past_due", "unpaid"]),
    currentPeriodEnd: z.string().datetime(),
  }),

  // Get subscription response
  subscriptionResponse: z.object({
    id: z.string(),
    status: z.enum(["active", "canceled", "past_due", "unpaid"]),
    customerId: z.string(),
    currentPeriodStart: z.string().datetime(),
    currentPeriodEnd: z.string().datetime(),
    cancelAtPeriodEnd: z.boolean(),
    created: z.string().datetime(),
    priceId: z.string(),
  }),

  // Checkout session response
  checkoutSessionResponse: z.object({
    sessionId: z.string(),
    url: z.string().url(),
  }),

  // Customer portal session response
  portalSessionResponse: z.object({
    url: z.string().url(),
  }),

  // Subscription plan information
  subscriptionPlan: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    currency: z.string(),
    interval: z.enum(["month", "year"]),
    features: z.array(z.string()),
  }),
} as const;

export type CreateCheckoutSessionRequest = z.infer<
  typeof BillingSchemas.createCheckoutSession
>;
export type CreatePortalSessionRequest = z.infer<
  typeof BillingSchemas.createPortalSession
>;
export type WebhookEventRequest = z.infer<typeof BillingSchemas.webhookEvent>;
export type SubscriptionStatusRequest = z.infer<
  typeof BillingSchemas.subscriptionStatus
>;
export type SubscriptionResponse = z.infer<
  typeof BillingSchemas.subscriptionResponse
>;
export type CheckoutSessionResponse = z.infer<
  typeof BillingSchemas.checkoutSessionResponse
>;
export type PortalSessionResponse = z.infer<
  typeof BillingSchemas.portalSessionResponse
>;
export type SubscriptionPlan = z.infer<typeof BillingSchemas.subscriptionPlan>;
