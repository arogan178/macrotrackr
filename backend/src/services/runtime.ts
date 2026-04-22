import type { Database } from "bun:sqlite";
import { type CacheService, createCacheService } from "./cache-service";
import {
  configureMetricsRegistry,
  createMetricsRegistry,
  type MetricsRegistry,
} from "../lib/observability/metrics";
import {
  configureAlertingService,
  createAlertingService,
  type AlertingService,
} from "../lib/observability/alerting";
import { configureSubscriptionService } from "../modules/billing/subscription-service";
import {
  getStripeClient,
} from "../modules/billing/stripe-service";
import {
  configureEmailService,
  createEmailService,
} from "./email-service";
import { getConfig } from "../config";

export interface RuntimeServices {
  db: Database;
  cacheService: CacheService;
  metrics: MetricsRegistry;
  alerting: AlertingService;
  stripe: ReturnType<typeof getStripeClient> | null;
  email: ReturnType<typeof createEmailService> | null;
}

export function createRuntimeServices(db: Database): RuntimeServices {
  const config = getConfig();
  const cacheService = createCacheService();
  const metrics = createMetricsRegistry();
  const alerting = createAlertingService();
  const stripe = config.BILLING_MODE === "managed" ? getStripeClient() : null;
  const email =
    config.EMAIL_MODE !== "disabled"
      ? createEmailService()
      : null;

  configureMetricsRegistry(metrics);
  configureAlertingService(alerting);
  configureSubscriptionService({ db, cacheService });
  if (email) {
    configureEmailService(email);
  }

  return {
    db,
    cacheService,
    metrics,
    alerting,
    stripe,
    email,
  };
}
