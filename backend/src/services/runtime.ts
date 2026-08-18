import type { Database } from "bun:sqlite";
import { type CacheService, createCacheService } from "./cache-service";
import {
  configureMetricsRegistry,
  createMetricsRegistry,
  type MetricsRegistry,
} from "../lib/observability/metrics";
import { configureSubscriptionService } from "../modules/billing/subscription-service";
import {
  getStripeClient,
} from "../modules/billing/stripe-service";
import {
  type EmailService,
  emailService,
} from "./email-service";
import { getConfig } from "../config";

export interface RuntimeServices {
  db: Database;
  cacheService: CacheService;
  metrics: MetricsRegistry;
  stripe: ReturnType<typeof getStripeClient> | null;
  email: EmailService | null;
}

export function createRuntimeServices(db: Database): RuntimeServices {
  const config = getConfig();
  const cacheService = createCacheService();
  const metrics = createMetricsRegistry();
  const stripe = config.BILLING_MODE === "managed" ? getStripeClient() : null;
  const email = config.EMAIL_MODE !== "disabled" ? emailService : null;

  configureMetricsRegistry(metrics);
  configureSubscriptionService({ db, cacheService });

  return {
    db,
    cacheService,
    metrics,
    stripe,
    email,
  };
}
